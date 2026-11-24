# Spec Delta

## Purpose

Definir cuándo y cómo se capturan las evidencias gráficas en los tests para que cada imagen corresponda al estado que el test afirma, sea legible, estable, trazable y pueda persistirse en RunLab.

## ADDED Requirements

### Requirement: Captura alineada con el estado validado
El kit de pruebas SHALL tomar cada captura declarada únicamente después de verificar explícitamente el estado visible que su nombre describe, y MUST NOT basarse solo en esperas de tiempo o en un cambio de URL.

#### Scenario: Estado verificado antes de la captura
- **WHEN** un test declara una captura cuyo nombre describe un estado concreto (formulario cargado, registro creado, tooltip visible, modo solo lectura)
- **THEN** el test comprueba mediante aserciones sobre la UI ese estado antes de generar la imagen

#### Scenario: Esperas temporales insuficientes
- **WHEN** el único indicio previo a una captura es un `waitForTimeout` o una navegación/URL esperada
- **THEN** se añade una comprobación del contenido o del elemento visible correspondiente antes de capturar

#### Scenario: Acciones verificadas por API sin reflejo visual
- **WHEN** el nombre de una captura afirma un resultado (creación, guardado, validación de payload) comprobado solo por API
- **THEN** el test verifica además la representación visible de ese resultado antes de capturar, o renombra la captura según el estado realmente visible

### Requirement: Estabilidad de la imagen capturada
El kit de pruebas SHALL estabilizar la vista antes de capturar para que la imagen no contenga estados transitorios, artefactos de animación ni elementos validados desaparecidos.

#### Scenario: Animaciones y caret
- **WHEN** se captura una vista con animaciones CSS, transiciones o caret del cursor
- **THEN** la captura desactiva esos artefactos y muestra el estado final de la interfaz

#### Scenario: Elementos efímeros validados
- **WHEN** el estado validado es un tooltip, popover u otro elemento dependiente de hover/foco
- **THEN** la imagen final contiene ese elemento visible en la posición esperada

#### Scenario: Contenido aún cargando
- **WHEN** la vista depende de datos o recursos locales que aún no han terminado de cargar
- **THEN** la captura se pospone hasta que el estado validado esté presente

### Requirement: Calidad y configuración explícitas de la captura
El kit de pruebas SHALL aplicar opciones explícitas y coherentes de formato, escala, fullPage y compresión a cada captura, respetando la configuración de evidencia efectiva del perfil.

#### Scenario: Captura legible
- **WHEN** se genera una captura de evidencia
- **THEN** el archivo resultante usa el formato y la escala configurados y sus dimensiones son coherentes con el viewport o con `fullPage` según corresponda

#### Scenario: Configuración del perfil
- **WHEN** el perfil define el modo de captura, `fullPage` y opciones de calidad
- **THEN** las capturas respetan esos valores y no los contradicen con valores globales fijos

#### Scenario: Captura desactivada
- **WHEN** el modo de captura es `off` o `only-on-failure` y el test no falla
- **THEN** no se generan capturas declaradas como evidencia obligatoria, salvo que el test las requiera explícitamente

### Requirement: Adjunto persistible y trazable
Cada captura SHALL quedar adjunta al resultado del test con un nombre determinista que identifique test, paso y estado, y con una representación en disco utilizable por el runner.

#### Scenario: Nombre determinista
- **WHEN** un test declara una captura con un nombre concreto
- **THEN** el adjunto conserva ese nombre o una derivación inequívoca, sin colisiones entre tests parametrizados ni prefijos duplicados

#### Scenario: Archivo disponible
- **WHEN** se genera una captura
- **THEN** el adjunto incluye una ruta de archivo accesible además del contenido en memoria

#### Scenario: Captura declarada pero no generada
- **WHEN** un test declara una captura y al finalizar no existe el adjunto correspondiente
- **THEN** la comprobación de integridad señala la captura ausente en lugar de dar el resultado por completo
