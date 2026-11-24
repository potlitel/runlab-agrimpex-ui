# Design

## Context

Ver `proposal.md` para la motivación. Estado actual: `agent/index.js` ya despacha `check`, `containers`, `status`, `run`, `ensureGrid`, `stop`, `start` y `report`; `agentRegistry.request()` soporta `wait:false` y reenvía `agent:event` a la sala `profile:<id>`; `dockerControl.ensureGrid()` ya elige agente por `workstationId`. En cambio `routes/tests.js` llama directamente a `collectTests()` y `runTests()`, y el scheduler hace lo mismo tras `ensureGrid()`. El timeout por defecto del registry es de 15 s, pensado para Docker, no para suites completas.

## Goals / Non-Goals

**Goals:**
- Un único punto de decisión de transporte para `collect`, `run`, `abort` y `status`, consistente con `ensureGrid`.
- Reutilizar el collector/runner existente dentro del agente, sin duplicar la lógica de ejecución.
- Mantener el contrato de endpoints y eventos que ya consume la UI.
- Transferir resultados y evidencias al servidor con límites y trazabilidad por corrida.

**Non-Goals:**
- Rediseñar la UI de ejecución ni cambiar el contrato REST/Socket observable por el navegador.
- Instalar Playwright en la imagen del agente: la workstation debe tener el kit y sus dependencias.
- Balanceo entre varias workstations, migración de corridas en curso entre agentes ni ejecución simultánea en varios agentes.
- Cambiar el modelo de autenticación del agente (token global ya existente).

## Decisions

- **Selector de transporte en la API:** nuevo helper `services/testControl.js`, análogo a `dockerControl.js`. Sin `RUNLABQA_DOCKER_TRANSPORT=local`, un perfil con `workstationId` usa agente; sin ID usa la ruta local actual. Se rechaza la corrida si el agente no está registrado, sin fallback silencioso. Alternativa descartada: añadir un campo `transport` por perfil; duplicaría el puntero `workstationId` ya documentado y obligaría a migrar configs.
- **Operaciones del agente:** `collect` (request con espera y timeout ampliado), `runTests` (dispatch inmediato, progreso por eventos) y `abort` (request corto con espera). `agent/index.js` reutiliza `playwrightCollector` y `playwrightRunner` con un adaptador de `io` que convierte cada `emit` en `agent:event` con el `requestId` de la corrida. Alternativa descartada: mantener la corrida en la API y solo levantar Docker en el agente; es el estado actual y no cumple el objetivo.
- **Contexto de ejecución:** la API resuelve `projectPath`, comando del runner, entorno, parámetros por test y opciones igual que hoy, y los envía como `args`. Así la workstation no necesita leer `envPath` ni archivos del perfil del servidor. El agente no incluye valores de entorno en logs; la API aplica además una capa de redacción sobre `test:output` para claves del tipo `TOKEN|PASSWORD|SECRET|KEY`.
- **Seguimiento de corridas remotas:** registro en memoria `profileId/requestId → { agentId, startedAt }`. `routes/tests.js` consulta ese registro en `/tests/status` y para el `409` de corrida ya en curso; `abort` enruta al agente dueño de la corrida. El registry necesita un hook de fallo para las operaciones `wait:false`, de modo que una desconexión del agente emita `execution:failed` en lugar de dejar la corrida colgada.
- **Artefactos:** el agente envía por `agent:result` un manifiesto y los archivos en base64 (JSON de resultado, `report.html`, capturas y traces), leyendo solo rutas relativas dentro del directorio de reportes de la corrida. La API valida extensiones permitidas, rechaza `..`, aplica tope por archivo (10 MB) y total por corrida (50 MB) y escribe en el `reportsDir` del perfil bajo un subdirectorio `agent/<runId>` para evitar colisiones. Alternativa descartada: que la API descargue los artefactos por HTTP; el agente no abre puertos por diseño.
- **Grid:** `ensureGrid` se invoca antes de despachar la corrida remota y usa el mismo `workstationId`. El scheduler pasa por el mismo helper que la ruta manual, de modo que las corridas programadas y las manuales tengan el mismo transporte.
- **Timeouts:** `collect` usa un timeout configurable (por defecto 60 s), `abort` uno corto y `runTests` se considera despachado al instante; la finalización llega por evento o por el manifiesto final. Se mantiene el timeout de 15 s para las operaciones Docker actuales.

## Risks / Trade-offs

- [Conexiones Socket.io con payloads grandes] → chunking en base64, límites por archivo y total, y manifiesto verificable antes de escribir.
- [La workstation no tiene Playwright instalado] → error explícito en `collect`/`runTests` que nombra el kit y el `RUNLABQA_AGENT_ID`; documentar el prerrequisito.
- [Secretos en variables de entorno de la corrida] → redacción en el agente y en el reenvío de eventos; nunca se incluyen en el manifiesto de artefactos.
- [Desconexión a mitad de corrida] → hook de fallo en el registry que cierra la corrida y emite el evento de finalización; el scheduler no la reintenta automáticamente.
- [Colisión de `reportId` entre API y agente] → namespace `agent/<runId>` y `runId` derivado del `requestId`.
- [Cambio de comportamiento respecto al despliegue actual] → perfiles sin `workstationId` siguen en local; `RUNLABQA_DOCKER_TRANSPORT=local` restaura el modo anterior por completo.

## Migration Plan

1. Desplegar la API con el nuevo helper sin cambiar variables: los perfiles con `workstationId` empiezan a usar el agente; el resto continúa igual.
2. Configurar `RUNLABQA_AGENT_TOKEN`, arrancar los agentes y verificar `/api/docker/agents` antes de lanzar suites remotas.
3. Rollback: `RUNLABQA_DOCKER_TRANSPORT=local` y recrear la API. Los artefactos ya transferidos permanecen en el perfil; las corridas en curso se abortan al desconectar el agente.
