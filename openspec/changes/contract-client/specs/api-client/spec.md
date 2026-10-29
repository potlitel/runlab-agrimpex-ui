## Purpose

Proporcionar acceso tipado al API REST del backend, con inyección del perfil activo y manejo neutro de errores, para que las vistas consuman el contrato sin acoplarse al transporte.

## ADDED Requirements

### Requirement: Cliente HTTP base con perfil
El cliente SHALL usar axios con base URL relativa `/api` (proxy en dev) y SHALL inyectar el header `X-Profile-Id` del perfil activo en cada petición.

#### Scenario: Petición con perfil activo
- **WHEN** existe un perfil activo en la sesión
- **THEN** toda petición sale con header `X-Profile-Id` correspondiente

### Requirement: Contrato de configuración y tests
El cliente SHALL exponer métodos para `GET/POST /config`, `POST /config/validate`, `GET /tests/collect`, `GET /tests/cached` y `POST /tests/run`.

#### Scenario: Disparar corrida
- **WHEN** se invoca ejecutar con una selección de tests
- **THEN** se envía `POST /tests/run` y se devuelve el acuse del backend

### Requirement: Contrato de módulos
El cliente SHALL exponer métodos para reports, variables/entornos, docker, schedules, evidencia de errores, automation, features, txtdata, jsondata, profile-admin y system, espejo del contrato del backend.

#### Scenario: Listado de reportes
- **WHEN** se solicita el historial
- **THEN** se devuelve el listado de ejecuciones con resumen por run

### Requirement: Manejo de errores
El cliente SHALL rechazar con un error tipado ante respuestas no 2xx, sin redirigir ni mutar estado de sesión (no hay auth en esta etapa).

#### Scenario: Error del backend
- **WHEN** el backend responde 4xx/5xx
- **THEN** la promesa rechaza con status y payload, y la vista decide cómo mostrarlo