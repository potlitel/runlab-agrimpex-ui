# Spec Delta

## Purpose

Garantizar que las capturas declaradas por los tests se persistan, se asocien a su corrida y se muestren en RunLab con fidelidad, de modo que el dashboard refleje de forma fiable la evidencia generada durante la ejecución.

## ADDED Requirements

### Requirement: Persistencia de adjuntos de imagen sin ruta
El runner SHALL persistir los adjuntos de imagen que llegan solo como contenido en memoria, escribiéndolos en el directorio de assets de la corrida y asignándoles una ruta de asset utilizable por la UI.

#### Scenario: Adjunto solo con contenido
- **WHEN** el reporte JSON de la corrida contiene un adjunto de imagen con contenido en memoria y sin ruta de archivo
- **THEN** el runner escribe el archivo en los assets de la corrida y completa `assetPath` y `contentType`

#### Scenario: Adjunto con ruta existente
- **WHEN** el adjunto ya dispone de una ruta de archivo válida
- **THEN** el runner conserva la referencia existente sin duplicar el archivo ni alterar su nombre

#### Scenario: Contenido no válido
- **WHEN** un adjunto declarado como imagen no contiene bytes de imagen válidos
- **THEN** se registra la incidencia y el resto de la corrida se normaliza sin fallar

### Requirement: Publicación de capturas de tests que pasan
El sistema SHALL asociar al reporte las capturas declaradas por los tests en cualquier resultado (passed, failed, error), y MUST NOT limitar la evidencia disponible a los tests fallidos.

#### Scenario: Test exitoso con capturas
- **WHEN** un test termina en `passed` y adjuntó capturas declaradas
- **THEN** el reporte expone esos assets y el resumen de la corrida puede utilizarlos como imagen de vista previa

#### Scenario: Test fallido
- **WHEN** un test falla y genera capturas propias además de los artefactos automáticos
- **THEN** tanto las capturas declaradas como el screenshot, trace y vídeo de fallo quedan asociados a la corrida

#### Scenario: Sin capturas declaradas
- **WHEN** una corrida no declara capturas y ningún test falla
- **THEN** el reporte indica ausencia de evidencia sin inventar assets ni mostrar placeholders como si fueran capturas

### Requirement: Trazabilidad y acceso a la evidencia
El sistema SHALL exponer cada captura con su nombre, el test y paso al que pertenece y metadatos de imagen suficientes para identificarla, visualizarla y descargarla.

#### Scenario: Consulta de evidencia
- **WHEN** se consulta la evidencia de una corrida
- **THEN** se devuelven nombre, resultado del test, origen, `contentType`, `assetPath` o URL y dimensiones cuando estén disponibles

#### Scenario: Descarga de la imagen original
- **WHEN** se solicita una captura concreta
- **THEN** el endpoint sirve el archivo original con el tipo de contenido correcto

#### Scenario: Captura declarada ausente
- **WHEN** un test declaró una captura pero la corrida no contiene el asset correspondiente
- **THEN** se reporta la inconsistencia en el reporte o en una comprobación de integridad en lugar de presentar la corrida como completa

### Requirement: Visualización fiel en la UI
La UI SHALL mostrar la evidencia sin recortar ni deformar la imagen, permitir inspeccionarla a resolución completa y distinguir el test y paso al que pertenece.

#### Scenario: Miniatura y visor
- **WHEN** el usuario visualiza una captura en la galería o en el detalle de reporte
- **THEN** la miniatura conserva la relación de aspecto y el visor permite ampliar y abrir o descargar la imagen original

#### Scenario: Formatos de imagen
- **WHEN** un adjunto de evidencia es PNG, JPEG o WebP
- **THEN** la UI lo renderiza con su formato real sin sustituirlo por un placeholder por error de detección

#### Scenario: Imagen no disponible
- **WHEN** el asset solicitado no puede cargarse o ya no existe
- **THEN** se muestra un mensaje de error únicamente para esa imagen y la galería permanece utilizable

### Requirement: Fidelidad en la exportación PDF
La UI SHALL incrustar las capturas en el PDF conservando su relación de aspecto y aplicando el formato y la compresión adecuados, sin degradar su legibilidad.

#### Scenario: Capturas de proporciones distintas
- **WHEN** el PDF incluye capturas de página completa y de viewport con proporciones diferentes
- **THEN** cada imagen se ajusta al área disponible manteniendo su proporción original y sin recortarse

#### Scenario: Formato distinto de PNG o JPEG
- **WHEN** una captura usa un formato como WebP
- **THEN** se incrusta correctamente o se transforma a un formato legible sin provocar el fallo de la exportación

#### Scenario: Evidencia faltante en el PDF
- **WHEN** una imagen declarada no está disponible durante la generación del PDF
- **THEN** el PDF se genera con las imágenes disponibles y señala la referencia faltante sin interrumpir la exportación

### Requirement: Configuración de evidencia coherente entre sistemas
El sistema SHALL aplicar la misma configuración efectiva de captura en la UI, el runner y el kit de Playwright, y MUST NOT contradecir las opciones guardadas en el perfil con valores fijos en otro componente.

#### Scenario: Guardar opciones de calidad
- **WHEN** el usuario guarda opciones de evidencia (modo, `fullPage`, formato, escala o calidad) en el perfil
- **THEN** la corrida siguiente utiliza esos valores y la UI refleja la configuración efectiva aplicada

#### Scenario: Perfil sin opciones explícitas
- **WHEN** el perfil no define alguna opción de evidencia
- **THEN** se aplica el valor por defecto documentado y todas las capturas de la corrida usan el mismo valor
