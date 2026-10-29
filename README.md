# RunLab Agrimpex — UI

Frontend del dashboard QA para gestionar y ejecutar la suite Playwright de
Agrimpex (backoffice Angular + API Symfony). React 19 + Vite + TanStack
Router/Query/Table + shadcn/ui + Tailwind 4.

> **Línea base:** esqueleto UI de `DAM.Frontend.React` (plantilla
> [shadcn-admin](https://github.com/satnaing/shadcn-admin), MIT © Sat Naing;
> adaptaciones © potlitel). El contrato API/socket proviene del repo hermano
> `runlab-agrimpex-api`, a su vez adaptado de
> [QADash backend](https://github.com/hramses1/dash-backend) (MIT © hramses1).

## Arquitectura

```
runlab-agrimpex-api   (Express + Socket.io :3001)  ←→  runlab-agrimpex-ui (React :5173 dev / dist en prod)
        │                                                        │
        └── spawn: npx playwright test <specs> ──→  playwright-kit-profesional (AUT: localhost:5000 / :8990)
```

- El backend sirve el build del frontend en producción (mismo puerto).
- En desarrollo, Vite hace proxy de `/api` y `/socket.io` hacia `:3001`.
- Sin auth en esta etapa (herramienta de red de confianza).

## Vistas

Dashboard (árbol de tests + ejecución en vivo), Reportes (historial +
analítica), Evidencia de fallos (screenshots/traces), Tests, Entornos (`.env`
+ perfiles), Docker, Calendarización, Datos de prueba, Ajustes.

## Comandos

```bash
npm install
npm run dev       # Vite en :5173 (requiere el API en :3001)
npm run build     # tsc + vite build + gzip
npm run preview
```

## Licencia

MIT — ver `LICENSE`. Atribuciones en el encabezado de este archivo.

## Convención de nombres de changes (OpenSpec)

Los changes en este repo siguen la convención: **el nombre del change = la capability principal que introduce** (sustantivo, kebab-case).

| Change | Capability principal | Qué significa |
|---|---|---|
| `contract-client` | `contract-client` | Es la capa que **habla el contrato** (REST + Socket.io) con el backend. Sus 2 capabilities (`api-client`, `socket-client`) son **clientes del contrato** (contract clients). El nombre describe **qué es** (un cliente del contrato) no **qué hace** (fetch data, open socket), que es detalle de implementación. En OpenSpec el nombre del change coincide con la capability root del delta. |

> **Regla práctica**: el nombre del change = sustantivo que nombra la capability principal (no verbos como `add-...` ni prefijos `feat-`). Sirve como clave de búsqueda en `openspec list`.
