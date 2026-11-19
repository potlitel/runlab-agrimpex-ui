## 1. Listado de evidencias

- [ ] 1.1 Implementar consulta y render de evidencias (`errorsApi.images`) con metadatos y estados configured/missing/empty; verificar visualización en cada estado.
- [ ] 1.2 Manejar errores de carga y módulo deshabilitado; verificar feedback claro sin romper la vista.

## 2. Visor de imágenes

- [ ] 2.1 Implementar galería/visor que cargue imágenes vía `errorsApi.imageUrl`; verificar apertura y visualización de una evidencia.
- [ ] 2.2 Manejar fallos de carga de imagen individual; verificar fallback/mensaje y continuidad de uso.

## 3. Verificación

- [ ] 3.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [ ] 3.2 Validar con backend y evidencias disponibles: listado y visualización funcionan según el contrato.
