# Spec Delta

## Purpose

Define la coreografía visual del dashboard de ejecución: entradas escalonadas, transiciones entre estados y feedback de cambios en vivo, preservando accesibilidad, rendimiento y estabilidad ante re-render.

## ADDED Requirements

### Requirement: Entrada escalonada de las secciones del dashboard

Al montar el dashboard o cambiar de perfil, las secciones SHALL aparecer con una entrada escalonada en orden de lectura, combinando opacidad y un desplazamiento vertical corto. La animación no SHALL bloquear la interacción ni retrasar la disponibilidad de los datos.

#### Scenario: Carga inicial del dashboard

- **WHEN** el dashboard se monta con un perfil activo
- **THEN** el banner de guía, el contexto, la última corrida, la consola y los resultados aparecen en ese orden con un escalonado breve, y sus controles quedan interactivos al terminar

#### Scenario: Cambio de perfil activo

- **WHEN** el usuario cambia el perfil activo
- **THEN** el contenido del dashboard vuelve a entrar con el escalonado, mientras el encabezado de la página permanece visible y sin animación de salida

### Requirement: Transiciones entre estados de los paneles

Cuando un panel reemplaza su estado vacío, de carga o de error por contenido, o viceversa, el cambio SHALL resolverse con una transición de opacidad que evite el salto brusco. El estado final SHALL conservar los datos, textos y acciones que le corresponden.

#### Scenario: Llega la configuración del proyecto

- **WHEN** la consulta de configuración del proyecto resuelve y el panel de contexto deja de mostrar valores «No registrado»
- **THEN** los valores reales aparecen con una transición de opacidad y el panel se ajusta a su nueva altura sin saltos bruscos

#### Scenario: Llega el reporte de la última corrida

- **WHEN** el identificador del reporte pasa de ausente a disponible
- **THEN** el esqueleto de última corrida se sustituye por los datos reales y las acciones de reporte con una transición de opacidad

#### Scenario: Error de configuración

- **WHEN** la consulta de configuración falla
- **THEN** el mensaje de error y las acciones de reintento y navegación aparecen con la misma transición, sin ocultar los demás paneles

### Requirement: Feedback visual de cambios en la ejecución en vivo

La consola y la tabla de resultados SHALL señalar los cambios relevantes de la corrida mediante movimiento acotado: entrada de nuevas líneas de log, aparición del resumen, actualización del progreso y transición de estado de un test. El movimiento SHALL limitarse a opacidad y transformaciones, y no SHALL alterar el orden de los datos, los valores mostrados ni el autoscroll de la consola.

#### Scenario: Nueva línea de log

- **WHEN** se agrega una línea de log durante la ejecución
- **THEN** la línea entra con una transición corta de opacidad y desplazamiento, y la consola mantiene el desplazamiento automático hacia el evento más reciente

#### Scenario: Un test termina

- **WHEN** un resultado pasa de `running` a `passed`, `failed` o `error`
- **THEN** la fila muestra un destello verde o rojo una sola vez y el badge de estado se actualiza, sin repetir el destello en filas que ya estaban en estado terminal

#### Scenario: Cambia el progreso

- **WHEN** el porcentaje de progreso avanza
- **THEN** la barra y el porcentaje acompañan el cambio de forma continua y el valor accesible del progreso coincide con el valor mostrado

#### Scenario: Se limpian los logs

- **WHEN** el usuario limpia el buffer de logs
- **THEN** las líneas desaparecen de inmediato, sin animación de salida

### Requirement: Movimiento reducido y accesibilidad

Cuando el sistema operativo declara `prefers-reduced-motion: reduce`, el dashboard SHALL suprimir las animaciones de desplazamiento y los count-up, mostrando los valores finales de inmediato. La semántica accesible de la consola y de la tabla SHALL conservarse con o sin animaciones.

#### Scenario: Preferencia de movimiento reducido activa

- **WHEN** el usuario tiene activada la preferencia de movimiento reducido
- **THEN** las secciones aparecen sin desplazamiento ni escalonado, los números se muestran en su valor final y las transiciones restantes se limitan a opacidad

#### Scenario: Semántica preservada durante la animación

- **WHEN** la consola y la tabla se actualizan con animaciones activas
- **THEN** la región de log sigue siendo anunciable, el progreso conserva sus atributos accesibles y la tabla mantiene su estructura semántica y sus encabezados

### Requirement: Estabilidad del movimiento ante re-render

Las animaciones de entrada SHALL ejecutarse solo para elementos nuevos y no SHALL reproducirse para filas ya visibles que se re-renderizan por búsqueda, filtro, orden o agrupación. La tabla de resultados SHALL conservar su estructura semántica y no SHALL animar reordenamientos.

#### Scenario: Filtrar u ordenar resultados

- **WHEN** el usuario busca, filtra, ordena o agrupa los resultados existentes
- **THEN** las filas visibles se actualizan sin reproducir la animación de entrada

#### Scenario: Aparece un resultado nuevo

- **WHEN** se agrega un test que no estaba presente en la tabla
- **THEN** solo esa fila ejecuta la animación de entrada

#### Scenario: Expandir la salida de un test

- **WHEN** el usuario expande o contrae la salida completa de una fila
- **THEN** el área de salida se despliega o repliega con una transición de altura y la fila permanece dentro de la tabla
