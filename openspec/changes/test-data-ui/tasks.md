## 1. Datos TXT

- [x] 1.1 Implementar vista de datos TXT (`txtDataApi.get`) con render tabular y estados configurado/no configurado/error; verificar visualización.

## 2. Datos JSON y snapshots

- [x] 2.1 Implementar exploración del árbol y carga/guardado de archivos JSON (`jsonDataApi.tree/getFile/saveFile`); verificar navegación y persistencia.
- [x] 2.2 Implementar gestión de snapshots (`listSnapshots/saveSnapshot/deleteSnapshot`) por archivo; verificar creación, consulta y eliminación.
- [x] 2.3 Manejar errores de lectura/escritura y contenido inválido; verificar mensajes y preservación de estado editable cuando sea posible.

## 3. Composición y disponibilidad

- [x] 3.1 Componer la vista `/data` con secciones por fuente respetando flags `txtData`/`jsonData`; verificar visibilidad condicional.

## 4. Verificación

- [x] 4.1 Ejecutar `npm run lint` y `npm run build`; verificar que finalizan sin errores.
- [x] 4.2 Validar con backend y fuentes configuradas: TXT, JSON y snapshots operan según contrato.
