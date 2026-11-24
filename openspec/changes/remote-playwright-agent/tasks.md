# Tasks

## 1. Selector de transporte y registro de corridas

- [x] 1.1 Crear `services/testControl.js` que elija agente por `workstationId`, local sin ID y local obligado por `RUNLABQA_DOCKER_TRANSPORT=local`; verificar con tests unitarios los cuatro casos, incluido el error explícito con agente desconectado y sin fallback local.
- [x] 1.2 Añadir el registro en memoria de corridas remotas (`profileId`/`requestId`/`agentId`) con consulta de estado, detección de corrida en curso y enrutado de `abort`; verificar con tests que `/tests/status` y el `409` de `/tests/run` reflejen la corrida remota.

## 2. Operaciones del agente

- [x] 2.1 Implementar `collect` en `agent/index.js` reutilizando el collector con `projectPath` y comando recibidos como argumentos; verificar que un test con un kit falso devuelve `files`, `total` y `projects`, y que falta de Playwright produce un error explícito.
- [x] 2.2 Implementar `runTests` como operación de despacho inmediato con adaptador de `io` a `agent:event` y manifiesto final de artefactos; verificar que los eventos `execution:started`, `progress` y `execution:completed` llegan con el `requestId` de la corrida.
- [x] 2.3 Implementar `abort` en el agente y redacción de secretos en `test:output`; verificar con tests que el abort cancela la corrida y que un valor del entorno no aparece en los eventos reenviados.
- [x] 2.4 Ampliar los timeouts del registry para `collect`/`abort` y añadir hook de fallo para operaciones `wait:false`; verificar con tests que un timeout o una desconexión cierran la corrida y emiten `execution:failed`.

## 3. API, artefactos y scheduler

- [x] 3.1 Enrutar `/tests/collect`, `/tests/run`, `/tests/status` y `/tests/abort` a través de `testControl`; verificar con tests los perfiles con y sin `workstationId` y el rechazo cuando el agente no está registrado.
- [x] 3.2 Persistir artefactos del manifiesto en `reportsDir/agent/<runId>` validando extensiones, rutas relativas, 10 MB por archivo y 50 MB por corrida; verificar con tests el caso válido, `../` rechazado y límite excedido, y que `/reports` sigue sirviéndolos.
- [x] 3.3 Hacer que el scheduler use el mismo selector de transporte tras `ensureGrid`; verificar con un test que una corrida programada despacha al agente del `workstationId` y no ejecuta Playwright en la API.
- [x] 3.4 Documentar en `README.md` los prerrequisitos de la workstation, el contrato `collect`/`runTests`/`abort` y el rollback con `RUNLABQA_DOCKER_TRANSPORT=local`; verificar que los comandos documentados coinciden con el arranque real del agente.

## 4. Verificación de integración

- [x] 4.1 Ejecutar la batería completa de tests de la API y verificar que pasa sin regresiones en las operaciones Docker existentes.
- [x] 4.2 Probar con un agente real: `collect`, corrida remota con evidencias, abort y visualización de artefactos en la UI; verificar el resultado en `/reports` y los eventos en la sala del perfil.
