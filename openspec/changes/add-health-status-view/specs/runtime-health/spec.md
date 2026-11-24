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
