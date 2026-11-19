## 1. Hidratación y store de sesión

- [ ] 1.1 Implementar carga inicial de perfiles (`profileAdminApi.list`) e hidratación de `profileStore` (profiles, activeProfileId) al montar la app/layout; verificar que el store refleja los datos devueltos.
- [ ] 1.2 Manejar estados de carga, vacío y error en la hidratación; verificar que se muestra feedback adecuado y no se rompe la UI.

## 2. Selector y gestión de perfiles

- [ ] 2.1 Crear UI de selección de perfil activo en el shell y acción de activar perfil (`profileAdminApi.activate` + `setActive`); verificar que el perfil seleccionado queda activo y persiste en el contexto global.
- [ ] 2.2 Implementar acciones de crear, duplicar y renombrar perfiles con actualización del store/listado; verificar cada operación contra la API y el estado UI.
- [ ] 2.3 Implementar eliminación de perfil con confirmación y manejo de errores/restricciones del backend; verificar actualización correcta del perfil activo tras eliminar.

## 3. Integración Socket y estado por perfil

- [ ] 3.1 Conectar el socket y gestionar `join/leave` de `profile:<id>` al hidratar y al cambiar `activeProfileId`; verificar que se emiten join/leave según corresponda y se re-une tras reconexión.
- [ ] 3.2 Suscribirse a `profiles:status` y mostrar indicadores de ejecución por perfil en el shell; verificar actualización de indicadores ante eventos recibidos.

## 4. Verificación

- [ ] 4.1 Ejecutar `npm run lint` y `npm run build` en `runlab-agrimpex-ui`; verificar que ambos finalizan sin errores.
- [ ] 4.2 Validar manualmente con backend activo: selección/cambio de perfil actualiza contexto y sala socket; operaciones CRUD de perfil funcionan según el contrato.
