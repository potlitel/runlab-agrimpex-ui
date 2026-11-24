# Spec Delta

## Purpose

Definir el comportamiento de selección, renderizado y actualización de avatares de perfil en la UI, garantizando que todo perfil tenga un avatar obligatorio y reconocible en todas las superficies del dashboard.

## ADDED Requirements

### Requirement: Selección obligatoria de avatar al crear un perfil

La UI SHALL exigir la selección explícita de un avatar antes de confirmar la creación de un perfil, en todas las superficies de alta disponibles.

#### Scenario: Alta bloqueada sin avatar

- **WHEN** el usuario abre una superficie de alta de perfil, introduce un nombre válido y no ha seleccionado un avatar
- **THEN** la acción de crear permanece deshabilitada o muestra un error de validación y no se invoca la API

#### Scenario: Alta con avatar seleccionado

- **WHEN** el usuario selecciona un avatar y confirma la creación con un nombre válido
- **THEN** la UI envía el nombre y el avatar seleccionado a la API y agrega el perfil devuelto al catálogo local

#### Scenario: Cambio de nombre después de elegir avatar

- **WHEN** el usuario ya seleccionó un avatar y luego modifica el nombre del perfil
- **THEN** la selección de avatar se conserva y la creación sigue habilitada si el nombre es válido

### Requirement: Edición de perfil con avatar obligatorio

La UI SHALL ofrecer una edición de perfil que permita cambiar el nombre y el avatar, y SHALL impedir guardar si el perfil quedaría sin avatar.

#### Scenario: Edición con avatar existente

- **WHEN** el usuario abre la edición de un perfil que ya tiene avatar
- **THEN** el diálogo muestra el nombre actual y el avatar actual preseleccionado

#### Scenario: Guardar sin avatar

- **WHEN** el usuario intenta guardar una edición sin un avatar seleccionado
- **THEN** la UI bloquea el guardado y muestra la validación correspondiente sin invocar la API

#### Scenario: Guardar nombre y avatar

- **WHEN** el usuario modifica el nombre, selecciona otro avatar y confirma
- **THEN** la UI persiste ambos cambios y actualiza el perfil en el catálogo local y en las vistas que lo muestran

### Requirement: Galería modal de avatares

La UI SHALL presentar un selector modal con un conjunto de N avatares generados, permitir cambiar de estilo, regenerar candidatos y confirmar una única selección.

#### Scenario: Apertura de la galería

- **WHEN** el usuario pulsa la acción de elegir o cambiar avatar
- **THEN** se abre un modal con al menos N avatares visibles y la selección actual resaltada cuando exista

#### Scenario: Regenerar candidatos

- **WHEN** el usuario solicita generar otros avatares
- **THEN** la galería reemplaza los candidatos por un conjunto nuevo sin perder el avatar actualmente confirmado

#### Scenario: Cambiar de estilo

- **WHEN** el usuario selecciona otro estilo de avatar en la galería
- **THEN** los candidatos se regeneran con ese estilo y la selección previa deja de estar resaltada si no pertenece al nuevo conjunto

#### Scenario: Confirmar selección

- **WHEN** el usuario selecciona un avatar y confirma el modal
- **THEN** el avatar elegido se refleja en el formulario que abrió la galería

#### Scenario: Cancelar selección

- **WHEN** el usuario cierra el modal sin confirmar
- **THEN** el avatar previo del formulario no cambia

### Requirement: Renderizado consistente del avatar

La UI SHALL mostrar el avatar del perfil en el selector de perfil del sidebar, en cada opción del dropdown de perfiles, en la lista de gestión, en Ajustes > Perfiles y en el badge de perfil del header.

#### Scenario: Perfil con avatar

- **WHEN** un perfil tiene un avatar válido
- **THEN** todas las representaciones de ese perfil muestran la misma imagen de avatar

#### Scenario: Perfil sin imagen disponible

- **WHEN** no se puede generar o cargar la imagen de un avatar
- **THEN** la UI muestra un fallback con las iniciales del nombre del perfil sin romper el layout

#### Scenario: Perfil activo

- **WHEN** el usuario cambia el perfil activo
- **THEN** el avatar mostrado en el sidebar y en el header corresponde al nuevo perfil activo

### Requirement: Contrato de avatar en las operaciones de perfil

La UI SHALL leer y enviar el avatar como `{ style, seed }` en las operaciones de creación, actualización y duplicado, y SHALL reflejar en el store el avatar devuelto por la API.

#### Scenario: Crear perfil con avatar

- **WHEN** la API responde a la creación con un perfil que incluye avatar
- **THEN** la UI agrega el perfil al store con ese avatar y lo muestra de inmediato

#### Scenario: Actualizar avatar

- **WHEN** la API confirma la actualización de un perfil con un nuevo avatar
- **THEN** la UI reemplaza el avatar del perfil en el store y en las vistas abiertas

#### Scenario: Duplicar perfil

- **WHEN** el usuario duplica un perfil
- **THEN** la UI muestra el avatar del perfil duplicado devuelto por la API

#### Scenario: Error de persistencia

- **WHEN** la API rechaza una operación de creación o edición con avatar
- **THEN** la UI muestra el error, conserva el estado previo y permite reintentar sin perder la selección

### Requirement: Compatibilidad con perfiles heredados

La UI SHALL aceptar perfiles sin avatar provenientes de versiones anteriores y SHALL mostrarles un avatar por defecto determinista hasta que el usuario los edite.

#### Scenario: Perfil heredado sin avatar

- **WHEN** la API devuelve un perfil sin campo `avatar`
- **THEN** la UI le asigna un avatar por defecto determinista a partir del identificador del perfil y lo muestra en todas sus representaciones

#### Scenario: Edición de perfil heredado

- **WHEN** el usuario edita un perfil heredado sin avatar
- **THEN** el diálogo preselecciona el avatar por defecto y exige confirmar un avatar antes de guardar
