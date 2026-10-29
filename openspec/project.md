# RunLab Agrimpex — UI

Frontend del dashboard QA para gestionar y ejecutar la suite Playwright de Agrimpex.

## Contexto

- **Producto**: panel web para ejecutar la suite E2E del kit `playwright-kit-profesional` sin abrir la terminal; consumo del API de `runlab-agrimpex-api`.
- **Línea base**: esqueleto UI de `DAM.Frontend.React` (plantilla [shadcn-admin](https://github.com/satnaing/shadcn-admin), MIT © Sat Naing; adaptaciones © potlitel), **sin Clerk** en esta etapa (herramienta LAN).
- **Stack**: React 19, Vite 7, TanStack Router/Query/Table, shadcn/ui (Radix), Tailwind 4, zustand, axios, `socket.io-client`, recharts, cmdk, sonner, TypeScript strict.
- **Dev**: Vite en `:5173` con proxy `/api` + `/socket.io` → `http://localhost:3001`. **Producción**: build estático servido por `runlab-agrimpex-api` (mismo puerto).

## Contrato

- Endpoints y eventos Socket.io espejo del backend (ver specs de `contract-client`).
- Header `X-Profile-Id` en cada petición REST; sala `profile:<id>` en Socket.io.

## Recordatorios pendientes

- **[A4 — despliegue]** Al servir en producción, el backend busca el build en `QADASH_DIST_DIR` (default actual apunta a `qadash-frontend/dist` del reference). Ver note en `runlab-agrimpex-api/openspec/project.md`.
