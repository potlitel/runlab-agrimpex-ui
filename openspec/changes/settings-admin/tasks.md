## 1. Configuración del proyecto y features

- [x] 1.1 Implementar sección de configuración (`configApi.get/save/validate/detectEnv/browse`) con formularios y feedback; verificar carga, guardado y validación.
- [x] 1.2 Implementar gestión de feature flags (`featuresApi.get/save`) con persistencia y reflejo en UI; verificar actualización de flags.

## 2. Automatización y entorno

- [x] 2.1 Implementar UI de automatización (`automationApi` config/check/install/update/branches/status/setup-venv/setup-deps/install-status/apply) con manejo de estados en curso; verificar invocación y feedback.
- [x] 2.2 Integrar eventos de progreso/logs (`automation:*`, `env:*`) en la sección correspondiente; verificar actualización en tiempo real.

## 3. Perfiles y sistema

- [x] 3.1 Implementar (o integrar) administración de perfiles en Ajustes usando `profileAdminApi`, manteniendo consistencia con el perfil activo global; verificar operaciones CRUD/duplicar/activar.
- [x] 3.2 Implementar sección de sistema (`systemApi.updates/update`) con manejo de token y eventos `system:update`; verificar consulta de estado y mensajes de habilitación/rechazo.

## 4. Verificación

- [x] 4.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [x] 4.2 Validar con backend: configuración, flags, automatización, perfiles y estado de sistema funcionan según contrato y restricciones.
