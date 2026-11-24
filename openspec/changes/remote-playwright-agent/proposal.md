# Proposal

## Why

El agente Node ya ejecuta Docker en la workstation asignada, pero `/tests/collect` y `/tests/run` siguen corriendo Playwright dentro de la API contra un bind mount del kit. Una suite lanzada desde la UI, hoy por hoy, **no se ejecuta en el otro host**. Además, el transporte es un interruptor global (`RUNLABQA_DOCKER_TRANSPORT`), incompatible con el diseño ya documentado de `workstationId` por perfil.

## What Changes

- Ampliar el contrato `agent:command` con las operaciones `collect`, `runTests` y `abort`, reutilizando el collector/runner existente en el proceso del agente.
- Enviar al agente el contexto completo de la corrida: `projectPath`, comando del runner, variables de entorno resueltas, parámetros por test, opciones (`project`, `grep`, `workers`, evidencia) y directorio de reportes.
- Elegir el transporte **por perfil**: con `workstationId` la ejecución va al agente; sin él se mantiene la ejecución local actual. `RUNLABQA_DOCKER_TRANSPORT=local` conserva el modo legado global para desarrollo.
- Reenviar al cliente los eventos ya conocidos (`execution:*`, `test:*`, `progress`, `test:output`) y transferir artefactos (JSON de resultado, `report.html`, screenshots/traces) del agente a la API con límites de tamaño, sin cambiar el contrato que consume la UI.
- Hacer que `/tests/status` y `/tests/abort` reflejen la corrida remota, y que `ensureGrid` siga ejecutándose en la misma workstation que la suite.
- Fallar explícitamente si el agente está desconectado o expira: **no** hay fallback silencioso a ejecución local, para no ejecutar pruebas en el servidor por error.

## Capabilities

### New Capabilities
- `agent-test-execution`: ejecución y recolección de suites en la workstation vía agente, incluida la selección de transporte por perfil, el reenvío de eventos y la entrega de artefactos.

### Modified Capabilities
_(ninguna — no existen specs canónicas en `openspec/specs/`; las capacidades relacionadas `docker-ui`, `environment-ui` y `execution-dashboard` viven hoy solo como deltas de cambios ya aplicados)_

## Impact

- **API (`runlab-agrimpex-api`):** `routes/tests.js`, `services/playwrightRunner.js`, `services/agentRegistry.js`, `services/scheduler.js` y `services/dockerControl.js`.
- **Agente (`runlab-agrimpex-api/agent/index.js`):** nuevo despacho de operaciones y envío de artefactos.
- **Socket:** `agent:command` / `agent:result` / `agent:event` + eventos `execution:*` y `test:*` existentes.
- **UI (`runlab-agrimpex-ui`):** sin cambios de contrato; reutiliza los eventos y endpoints actuales. El panel `/docker` ya distingue el estado real del agente.
- **Seguridad:** las variables de entorno de una corrida pueden contener secretos; no deben aparecer en logs ni en artefactos transferidos.
- **Dependencias:** arquitectura de agente documentada en `README.md` y campo `workstationId` por perfil.
