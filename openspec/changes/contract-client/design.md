## Context

El shell React quedó limpio de dominio DAM y Clerk. El contrato del backend está fijado por la referencia QADash (REST + Socket.io, header `X-Profile-Id`, salas `profile:<id>`). El kit ya trae axios, zustand y `socket.io-client`.

## Goals / Non-Goals

**Goals:** capa de datos tipada y reutilizable por todas las vistas futuras; aislamiento por perfil en REST y socket.
**Non-Goals:** vistas de UI (U2+), codegen de tipos desde el backend, manejo de auth.

## Decisions

- **D1 — Singleton de socket:** una sola conexión compartida; las salas se gestionan por perfil activo desde el hook `useSocket`.
- **D2 — Tipos a mano:** `src/types/contract.ts` espeja las respuestas y eventos del backend; sin codegen (el backend no expone OpenAPI).
- **D3 — Store zustand de perfil:** perfil activo + lista; consumido por el interceptor de axios y por el hook socket.
- **D4 — Namespaces en el api client:** `configApi`, `testsApi`, `reportsApi`, etc., sobre la instancia axios base existente.
- **D5 — Errores tipados:** clase/tipo `ApiError` con status + payload para que las vistas decidan la presentación.

## Risks / Trade-offs

- [Drift del contrato backend↔front] → tipos espejo + validación manual en cada change que toque endpoints; tests de contrato como backlog.
- [Eventos sin payload definido] → types discriminados por evento; el backend emite siempre `profileId` en el payload.
- [Reconexión durante corrida] → al reconectar se re-suscribe a la sala; el historial de run ya está en REST.