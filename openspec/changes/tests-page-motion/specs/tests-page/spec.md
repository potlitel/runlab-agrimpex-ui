# Spec Delta

## Purpose

Definir el comportamiento observable de la coreografía visual de la página de Tests: entradas escalonadas, transiciones entre estados, feedback de selección y ejecución, y respeto por la preferencia de movimiento reducido, sin alterar datos ni contratos.

## ADDED Requirements

### Requirement: Entrada escalonada de la página de Tests

Al montar la página o cambiar de perfil, las secciones de contenido SHALL aparecer en orden de lectura con una entrada escalonada que combine opacidad y un desplazamiento vertical corto. El encabezado SHALL permanecer visible y estable, sin animación de salida de la vista. La animación no SHALL retrasar la disponibilidad de datos ni la interacción con los controles.

#### Scenario: Carga inicial de la página de Tests

- **WHEN** se monta la página de Tests con un perfil activo
- **THEN** el contexto de proyecto, el explorador junto a los controles y la consola junto a los resultados aparecen en ese orden con un escalonado breve, y sus controles quedan interactivos al terminar

#### Scenario: Cambio de perfil activo

- **WHEN** el usuario cambia el perfil activo mientras está en la página de Tests
- **THEN** el contenido vuelve a entrar con el escalonado mientras el encabezado permanece sin animación de salida

### Requirement: Transiciones entre estados del catálogo y de los controles

Cuando el explorador de tests o los controles de corrida reemplazan su estado vacío, de carga o de error por contenido, o viceversa, el cambio SHALL resolverse con una transición de opacidad. El estado final SHALL conservar los textos, valores y acciones que le corresponden, y no SHALL ocultar las demás secciones de la página.

#### Scenario: Llega el catálogo de tests

- **WHEN** la consulta del catálogo resuelve y el explorador deja de mostrar el estado de carga o vacío
- **THEN** la lista de archivos y tests aparece con una transición de opacidad y el contador total muestra el valor recibido

#### Scenario: Falla la carga del catálogo

- **WHEN** la consulta del catálogo termina en error
- **THEN** el mensaje de error y las acciones de reintento aparecen con la misma transición y el resto de la página permanece visible

#### Scenario: Cambia el estado de la corrida desde los controles

- **WHEN** la corrida pasa de sin selección a lista para ejecutar, a iniciando o a en curso
- **THEN** el texto y las acciones visibles en los controles cambian con una transición de opacidad y los botones conservan sus estados deshabilitados según corresponda

### Requirement: Feedback de selección y ejecución en la página de Tests

La página SHALL señalar la selección de tests y el estado de la corrida mediante movimiento acotado: un pop breve en el badge de ejecución y en el contador de selección, y count-up en los contadores numéricos. El movimiento SHALL limitarse a opacidad, transformaciones y valores numéricos, y no SHALL alterar los datos, el orden de la lista ni las acciones disponibles.

#### Scenario: Aparece el badge de ejecución

- **WHEN** la corrida pasa a estar en curso
- **THEN** el badge «En ejecución» aparece con un pop breve y desaparece sin animación de salida cuando la corrida termina

#### Scenario: Cambia el número de tests seleccionados

- **WHEN** el usuario selecciona o deselecciona tests y el contador cambia
- **THEN** el contador de selección muestra el nuevo valor con un count-up corto que termina en el valor exacto y el botón de ejecución refleja la misma cantidad

#### Scenario: Se limpia la selección

- **WHEN** el usuario limpia la selección
- **THEN** el contador vuelve a cero sin animaciones de salida por elemento y las acciones de selección desaparecen de inmediato

### Requirement: Movimiento reducido y estabilidad ante re-render en la página de Tests

Cuando el sistema declara `prefers-reduced-motion: reduce`, la página SHALL suprimir desplazamientos, escalonados y count-ups, mostrando los valores finales de inmediato. Las animaciones de entrada SHALL ejecutarse solo al montar la sección y no SHALL reproducirse al buscar o filtrar el catálogo ya visible. Las animaciones propias de los overlays SHALL permanecer intactas.

#### Scenario: Preferencia de movimiento reducido activa

- **WHEN** el usuario tiene activada la preferencia de movimiento reducido
- **THEN** las secciones aparecen sin desplazamiento ni escalonado, los contadores muestran su valor final y las transiciones restantes se limitan a opacidad

#### Scenario: Buscar en el catálogo

- **WHEN** el usuario escribe en el buscador del explorador de tests
- **THEN** la lista filtrada se actualiza sin reproducir la animación de entrada de las secciones ni de los archivos ya visibles

#### Scenario: Abrir el visor de archivos

- **WHEN** el usuario abre el diálogo del visor de archivos
- **THEN** el overlay conserva su animación propia y no se ve afectado por la coreografía de la página
