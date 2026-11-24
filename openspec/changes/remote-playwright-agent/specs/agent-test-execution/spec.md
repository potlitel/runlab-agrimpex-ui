# Spec Delta

## Purpose

Define cómo las suites de pruebas se recolectan, ejecutan, abortan y entregan en la workstation asignada al perfil, manteniendo para la UI el mismo contrato observable que la ejecución local.

## ADDED Requirements

### Requirement: Selección de transporte por perfil
El sistema SHALL ejecutar la recolección y la corrida en el agente del `workstationId` cuando el perfil lo tenga asignado, y SHALL usar la ejecución local cuando no lo tenga, salvo que el modo legado global esté activo.

#### Scenario: Perfil asignado a una workstation
- **WHEN** se solicita `collect` o `run` para un perfil con `workstationId` y el agente está conectado
- **THEN** la operación se ejecuta en esa workstation y no en el servidor central

#### Scenario: Perfil sin workstation asignada
- **WHEN** se solicita una corrida para un perfil sin `workstationId`
- **THEN** el sistema ejecuta la suite localmente con el `projectPath` del perfil, como en el comportamiento actual

#### Scenario: Modo legado global
- **WHEN** el transporte global está configurado en `local`
- **THEN** todas las corridas se ejecutan en el servidor central, con independencia del `workstationId` del perfil

### Requirement: Contexto completo de la corrida
El sistema SHALL entregar al agente el contexto necesario para reproducir la corrida local: ruta del proyecto, comando del runner, variables de entorno resueltas, parámetros por test y opciones de ejecución.

#### Scenario: Corrida con entorno resuelto
- **WHEN** el usuario lanza una suite con entorno, parámetros globales y parámetros por test
- **THEN** el agente recibe todos esos valores y ejecuta exactamente la misma selección de tests que ejecutaría la API

#### Scenario: Secretos del entorno
- **WHEN** las variables de la corrida contienen credenciales
- **THEN** el sistema no las incluye en logs, eventos de progreso ni artefactos transferidos

### Requirement: Preparación de infraestructura en la misma workstation
El sistema SHALL preparar el grid Selenium en la misma workstation que ejecutará la suite cuando la corrida lo solicite.

#### Scenario: Corrida con Selenium en Docker
- **WHEN** la corrida solicita preparar el grid y el perfil tiene `workstationId`
- **THEN** el grid se levanta en esa workstation y la suite se conecta a la URL remota configurada

#### Scenario: Fallo al preparar el grid
- **WHEN** la preparación del grid falla en la workstation
- **THEN** la corrida no se inicia y el cliente recibe el error de preparación

### Requirement: Eventos de ejecución remota
El sistema SHALL reenviar al cliente los eventos de ejecución de la corrida remota con el mismo nombre y forma que los de una corrida local.

#### Scenario: Progreso de la corrida
- **WHEN** el agente emite inicio, progreso, salida de test y finalización
- **THEN** la UI del perfil recibe los eventos correspondientes sin distinción de transporte

#### Scenario: Desconexión durante la corrida
- **WHEN** el agente se desconecta mientras hay una corrida en curso
- **THEN** el sistema marca la corrida como fallida y notifica el evento de finalización con el error

### Requirement: Entrega de artefactos
El sistema SHALL transferir a la API los resultados y evidencias generados en la workstation, y SHALL hacerlos accesibles mediante los endpoints de reportes ya existentes.

#### Scenario: Corrida con evidencias
- **WHEN** la corrida remota termina y genera JSON de resultado, `report.html`, capturas o traces
- **THEN** la API dispone de esos artefactos y la UI puede consultarlos igual que en una corrida local

#### Scenario: Artefacto que excede el límite
- **WHEN** un artefacto supera el tamaño máximo permitido para transferencia
- **THEN** el sistema rechaza ese artefacto, conserva el resto de resultados y reporta el límite alcanzado

### Requirement: Fallo explícito y abort
El sistema SHALL rechazar la corrida si el agente no está disponible o no responde, sin recurrir silenciosamente a la ejecución local, y SHALL permitir abortar la corrida remota.

#### Scenario: Agente desconectado
- **WHEN** se solicita una corrida para un perfil cuyo agente no está registrado
- **THEN** la API responde con un error que identifica el `workstationId` y no ejecuta nada localmente

#### Scenario: Timeout del agente
- **WHEN** el agente no devuelve resultado dentro del plazo acordado
- **THEN** la corrida se marca como fallida y se informa del timeout al cliente

#### Scenario: Abortar una corrida remota
- **WHEN** el usuario solicita abortar una corrida en curso en el agente
- **THEN** el agente cancela la ejecución, el estado deja de indicar corrida activa y se emite el evento de abort
