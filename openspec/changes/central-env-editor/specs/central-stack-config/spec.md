# Spec Delta

## Purpose

Define la administración segura de la configuración central del stack y la resolución en runtime de las URLs públicas que consume la UI, sin exponer secretos ni exigir reconstruir el bundle.

## ADDED Requirements

### Requirement: Acceso protegido a la configuración del stack
El sistema SHALL habilitar la lectura y escritura de la configuración central solo cuando exista una credencial de administración configurada y se aporte en la petición.

#### Scenario: Token de administración configurado
- **WHEN** se solicita la configuración con la credencial de administración válida
- **THEN** el sistema permite consultar y modificar las variables permitidas

#### Scenario: Token de administración ausente
- **WHEN** no hay credencial de administración configurada en el servidor
- **THEN** los endpoints responden como deshabilitados y no revelan ningún valor de configuración

#### Scenario: Credencial inválida
- **WHEN** se solicita una modificación sin credencial o con una credencial incorrecta
- **THEN** el sistema rechaza la petición y no escribe ningún archivo

### Requirement: Lectura enmascarada de secretos
El sistema SHALL devolver únicamente las variables permitidas y SHALL representar los secretos existentes solo como estado «configurado», sin transmitir su valor al navegador.

#### Scenario: Secreto ya configurado
- **WHEN** la UI consulta la configuración y el token del agente tiene valor
- **THEN** la respuesta indica que está configurado, con el valor enmascarado u omitido

#### Scenario: Secreto sin configurar
- **WHEN** la UI consulta la configuración y el token del agente está vacío
- **THEN** la respuesta indica que no está configurado

#### Scenario: Variable fuera de la lista permitida
- **WHEN** el archivo central contiene una variable no administrable desde la UI
- **THEN** la respuesta no la incluye y una escritura posterior no la modifica

### Requirement: Escritura validada y atómica
El sistema SHALL aceptar solo claves permitidas y valores válidos, y SHALL escribir la configuración de forma atómica tras conservar una copia de seguridad.

#### Scenario: Actualización válida
- **WHEN** se envían variables permitidas con valores válidos
- **THEN** se crea una copia de seguridad y la configuración queda actualizada en una sola escritura

#### Scenario: Clave no permitida o valor inválido
- **WHEN** se envía una clave fuera de la lista permitida o un valor con saltos de línea
- **THEN** la petición se rechaza, se explica el motivo y el archivo permanece intacto

#### Scenario: Fallo durante la escritura
- **WHEN** la escritura atómica falla
- **THEN** la configuración anterior sigue vigente y se informa del error

#### Scenario: Separación de los entornos de prueba
- **WHEN** se guarda la configuración central
- **THEN** no se modifica ningún `.env` perteneciente al proyecto de pruebas ni a los perfiles

### Requirement: Recuperación de la configuración anterior
El sistema SHALL permitir restaurar la última copia de seguridad de la configuración central.

#### Scenario: Restaurar tras un cambio incorrecto
- **WHEN** el administrador solicita restaurar la configuración y existe una copia de seguridad
- **THEN** el archivo central vuelve a su contenido anterior y la UI refleja el estado restaurado

#### Scenario: Sin copia de seguridad disponible
- **WHEN** se solicita restaurar y no hay copia de seguridad
- **THEN** el sistema informa de que no hay restauración posible y no modifica el archivo

### Requirement: Configuración pública en tiempo de ejecución
La UI SHALL obtener las URLs de API y socket de un recurso servido en tiempo de ejecución, con el valor horneado actual como fallback, de modo que cambiar el hostname no exija reconstruir el bundle.

#### Scenario: Cambio de hostname
- **WHEN** se guarda una nueva URL pública y se recarga la UI
- **THEN** la UI utiliza la nueva URL servida en runtime sin necesidad de reconstruir la imagen

#### Scenario: Recurso de configuración no disponible
- **WHEN** el recurso de configuración en runtime no responde
- **THEN** la UI continúa con las URL horneadas en el bundle y avisa de la degradación

### Requirement: Estado pendiente de aplicar
El sistema SHALL distinguir los cambios que surten efecto inmediato de los que requieren recrear contenedores, y SHALL mostrar la acción necesaria sin incluir secretos en la respuesta.

#### Scenario: Cambio del token del agente
- **WHEN** se guarda un valor nuevo para el token del agente
- **THEN** la UI marca el cambio como pendiente de aplicar e indica que hay que recrear los contenedores afectados

#### Scenario: Cambio solo de URL pública
- **WHEN** se guarda una URL pública servida en runtime
- **THEN** la UI aplica el cambio sin marcarlo como pendiente de recreación
