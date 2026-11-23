#!/usr/bin/env bash
set -euo pipefail

# El script vive dentro del repo de la UI; los repos son hermanos un nivel arriba.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/runlab-agrimpex-api"
UI_DIR="$ROOT/runlab-agrimpex-ui"

API_PORT="${API_PORT:-3001}"
UI_PORT="${UI_PORT:-5173}"
UI_HOST="${UI_HOST:-0.0.0.0}"

if [ ! -d "$API_DIR" ] || [ ! -d "$UI_DIR" ]; then
  echo "Error: no se encontraron los directorios de API/UI en $ROOT" >&2
  exit 1
fi

pids=()

cleanup() {
  echo
  echo "Deteniendo servicios..."
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Iniciando API (runlab-agrimpex-api) en puerto ${API_PORT}..."
(
  cd "$API_DIR"
  PORT="$API_PORT" npm run dev
) &
pids+=("$!")

echo "Iniciando UI (runlab-agrimpex-ui) en puerto ${UI_PORT} (host ${UI_HOST})..."
(
  cd "$UI_DIR"
  npm run dev -- --host "$UI_HOST" --port "$UI_PORT"
) &
pids+=("$!")

echo
echo "Servicios lanzados:"
echo "  - API: http://localhost:${API_PORT} (Swagger: http://localhost:${API_PORT}/api/docs/)"
echo "  - UI:  http://localhost:${UI_PORT}"
echo "Presiona Ctrl+C para detener ambos."
echo

# Espera a que alguno termine; si uno cae, el trap limpiará el otro al salir
wait -n "${pids[@]}" || true
exit_code=$?
cleanup
exit "$exit_code"
