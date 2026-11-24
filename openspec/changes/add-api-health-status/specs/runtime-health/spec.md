# Spec Delta

## Purpose

Expone el estado operativo del backend RunLab para que Docker y la UI distingan un proceso que responde de un sistema capaz de persistir y servir evidencia, sin revelar información sensible ni bloquear el trabajo del usuario.

## ADDED Requirements

### Requirement: Liveness sin perfil

`GET /api/health` SHALL responder sin exigir `X-Profile-Id` y MUST NOT consultar filesystem, dependencias externas ni configuración de perfil; solo confirma que el proceso atiende HTTP.

#### Scenario: Sondeo del healthcheck
- **WHEN** Docker consulta `GET /api/health` sin cabecera de perfil
- **THEN** el endpoint responde `200` con `status`, `uptimeSeconds` y `version` dentro del timeout configurado

#### Scenario: Proceso caído
- **WHEN** el backend no atiende peticiones HTTP
- **THEN** el sondeo falla y el contenedor se marca como unhealthy tras reintentos

### Requirement: Readiness con checks críticos e informativos

`GET /api/health/detail` SHALL separar checks críticos (directorios de perfiles, reportes y galería de evidencias cuando está configurada) de checks informativos (perfil activo, `projectPath`, kit de Playwright, scheduler, socket.io y Docker/Grid).

#### Scenario: Recursos críticos disponibles
- **WHEN** los directorios críticos existen y son escribibles
- **THEN** el endpoint responde `200` con `status: "ok"`

#### Scenario: Fallo crítico
- **WHEN** algún directorio crítico no existe o no es escribible
- **THEN** el endpoint responde `503` con `status: "unhealthy"` y la lista de checks críticos fallidos

#### Scenario: Fallo informativo
- **WHEN** falla solo un check informativo como el kit de Playwright o Docker/Grid
- **THEN** el endpoint responde `200` con `status: "degraded"` y el check informativo queda registrado sin cambiar el código

#### Scenario: Galería no configurada
- **WHEN** el perfil no define `errorImagesPath`
- **THEN** el check de galería se marca `not_configured` y no cuenta como fallo crítico

### Requirement: Respuesta segura y estable

La respuesta de salud SHALL usar los valores `ok`, `degraded` y `unhealthy`, y MUST NOT exponer rutas absolutas, tokens, valores de entorno ni mensajes internos de excepción.

#### Scenario: Check con ruta faltante
- **WHEN** un check detecta un directorio ausente
- **THEN** la respuesta identifica el check por un identificador estable y omite la ruta del sistema de archivos

#### Scenario: Consumo por la UI
- **WHEN** la UI interpreta una respuesta de salud
- **THEN** puede derivar el estado y los checks fallidos sin parsear texto libre

### Requirement: Indicador de estado no bloqueante en la UI

La UI SHALL mostrar el estado del backend de forma informativa y MUST NOT condicionar la carga de la aplicación ni de las vistas de features al resultado del sondeo.

#### Scenario: Backend degradado
- **WHEN** el endpoint detallado devuelve `status: "degraded"`
- **THEN** la badge muestra el estado degradado y los checks fallidos, y el resto de la UI sigue utilizable

#### Scenario: Backend inalcanzable
- **WHEN** la petición de salud falla por red o `503`
- **THEN** la badge muestra ausencia de conexión y ofrece un reintento manual sin vaciar la pantalla

#### Scenario: Reintento manual
- **WHEN** el usuario pulsa el reintento de la badge
- **THEN** la UI vuelve a consultar el estado y actualiza el indicador

### Requirement: Señal de salud del contenedor

El contenedor API SHALL basar su healthcheck en `GET /api/health` y MUST NOT usar `GET /api/openapi.json` ni el endpoint detallado como señal de liveness.

#### Scenario: Arranque del contenedor
- **WHEN** se construye y levanta la imagen API
- **THEN** el healthcheck consulta `GET /api/health`

#### Scenario: Fallo informativo aislado
- **WHEN** un check informativo falla pero `GET /api/health` responde
- **THEN** el contenedor no se marca unhealthy por ese check informativo
