# Spec Delta

## Purpose

Expone el estado operativo del backend RunLab en una vista de diagnóstico legible y no bloqueante, para que los operadores distingan fallos críticos de avisos informativos sin interrumpir el trabajo del dashboard.

## ADDED Requirements

### Requirement: Vista de estado dedicada
La UI SHALL ofrecer una vista de salud accesible desde la navegación del dashboard y MUST NOT condicionar la disponibilidad de las demás vistas al resultado del sondeo de salud.

#### Scenario: Acceso desde la navegación
- **WHEN** un operador abre la sección **Sistema > Salud**
- **THEN** la vista de salud se muestra con el estado general del backend sin bloquear otras rutas

#### Scenario: Backend caído al abrir la vista
- **WHEN** la petición de salud falla durante la apertura de la vista
- **THEN** la vista permanece visible y el resto del dashboard sigue utilizable

### Requirement: Detalle legible de los checks
La vista SHALL mostrar estado general, tiempo activo, identificadores fallidos y listados separados de checks críticos e informativos, usando únicamente mensajes genéricos; MUST NOT revelar rutas, tokens ni valores de entorno.

#### Scenario: Respuesta degradada
- **WHEN** el backend responde `degraded` con un check informativo fallido
- **THEN** la vista muestra el estado degradado, el identificador del check fallido y el check en el grupo informativo

#### Scenario: Check no configurado
- **WHEN** un check informativo o la galería de evidencias devuelve `not_configured`
- **THEN** la vista lo presenta como «Sin configurar» y no lo cuenta como fallo

#### Scenario: Datos sensibles en el mensaje interno
- **WHEN** un check incluyera una ruta absoluta o un valor de entorno en su detalle interno
- **THEN** la vista muestra solo el mensaje genérico recibido y omite cualquier dato sensible

### Requirement: Sondeo y reintento manual
La vista SHALL compartir el mismo estado y el mismo intervalo de sondeo que la badge del header, y SHALL permitir un reintento manual que vuelve a consultar el backend sin recargar la página.

#### Scenario: Reintento manual
- **WHEN** el operador pulsa el botón **Actualizar**
- **THEN** la vista vuelve a consultar `/api/health/detail` y actualiza el estado sin recargar la página

#### Scenario: Sondeo automático
- **WHEN** transcurre el intervalo de sondeo configurado mientras la vista está abierta
- **THEN** el estado mostrado se refresca con la última respuesta del backend

### Requirement: Aviso de desconexión recuperable
La vista SHALL avisar claramente cuando no puede consultar el backend y MUST NOT vaciar su contenido ni impedir el reintento.

#### Scenario: Pérdida de conexión
- **WHEN** la consulta de salud termina en error de red o en una respuesta no válida
- **THEN** la vista muestra un aviso de desconexión con instrucción de reintento y conserva su estructura

#### Scenario: Recuperación tras reintento
- **WHEN** el backend vuelve a responder correctamente después de un aviso de desconexión
- **THEN** el aviso desaparece y la vista muestra el estado real sin recargar la página

### Requirement: Identificación visual de checks
La vista SHALL asignar un icono distintivo y una variante de badge semántica a cada check, y MUST NOT usar el color como único indicador de estado.

#### Scenario: Check correcto
- **WHEN** un check responde `ok`
- **THEN** la vista muestra su icono, un badge verde y la etiqueta «OK»

#### Scenario: Check sin configurar
- **WHEN** un check responde `not_configured`
- **THEN** la vista muestra un badge gris o amarillo y la etiqueta «Sin configurar»

#### Scenario: Check fallido
- **WHEN** un check responde `degraded` o `unhealthy`
- **THEN** la vista muestra un badge rojo y una etiqueta textual legible del estado

### Requirement: Historial y salud agregada
La vista SHALL mostrar una tendencia temporal del uptime o la latencia reciente y un indicador radial con el porcentaje de checks correctos, derivados del estado ya consultado.

#### Scenario: Nueva respuesta de salud
- **WHEN** llega una respuesta nueva del backend
- **THEN** la tendencia incorpora el punto y el indicador radial recalcula el porcentaje de checks correctos

#### Scenario: Historial insuficiente
- **WHEN** todavía no hay muestras suficientes para dibujar la tendencia
- **THEN** la vista muestra «Sin datos» sin bloquear el resto de la página

### Requirement: Indicador de sondeo
La vista SHALL mostrar la cuenta regresiva hasta el próximo sondeo y un indicador de refresco en curso, usando el intervalo y el estado existentes.

#### Scenario: Cuenta regresiva
- **WHEN** transcurre un segundo con la vista abierta
- **THEN** la cuenta regresiva disminuye desde 30 s y se reinicia tras cada sondeo

#### Scenario: Consulta en curso
- **WHEN** una consulta de salud está en curso
- **THEN** aparece un indicador visual de refresco que desaparece al completarse la consulta

### Requirement: Detalle sanitizado por check
La vista SHALL mostrar el tiempo relativo desde la última verificación de cada check y permitir expandirlo para ver su mensaje genérico; MUST NOT revelar stack traces, rutas, tokens ni valores de entorno.

#### Scenario: Tiempo relativo
- **WHEN** un check se actualiza
- **THEN** la vista muestra una referencia relativa como «Hace 5 s»

#### Scenario: Expansión de un check fallido
- **WHEN** se expande un check fallido
- **THEN** se muestra el mensaje genérico recibido sin stack trace ni ruta del sistema de archivos

#### Scenario: Mensaje con dato sensible
- **WHEN** el mensaje del check incluye un token o valor de entorno
- **THEN** la vista omite ese fragmento y conserva solo el texto genérico

### Requirement: Acción rápida de configuración
La vista SHALL ofrecer una acción «Configurar ahora» en los checks `not_configured` que dirija a la sección de ajustes correspondiente sin abandonar la sesión del perfil activo.

#### Scenario: Check no configurado con acción
- **WHEN** un check está `not_configured`
- **THEN** la vista muestra el botón «Configurar ahora» junto al check

#### Scenario: Uso de la acción rápida
- **WHEN** se pulsa «Configurar ahora»
- **THEN** la UI navega a la sección de ajustes del perfil activo
