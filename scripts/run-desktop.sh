#!/usr/bin/env bash
set -euo pipefail

# Start the app the way a desktop shell runs it: `platform: 'desktop'` and an
# absolute apiBaseUrl pointing at the bundled local API.
#
#   npm run start:desktop
#
# Same Angular bundle as `npm run start:web` — only runtime-config.js differs.
# That is the whole claim this script exists to demonstrate.
#
# ⚠ No Tauri shell exists yet. `../vendei-desktop` is PySide6/Python, and
# converting it was explicitly out of scope. This script therefore emulates the
# *shape* of a desktop run against a real browser: platform=desktop, and the API
# on its own port (3999) reached by absolute URL with CORS, instead of
# same-origin through a proxy. What you can verify here is the frontend half —
# that PlatformService reports 'desktop' and that the API-base plumbing works.
# The shell itself still has to be written in Rust; see
# docs/architecture/target-architecture.md.
#
# Ports: DESKTOP_API_PORT (default 3999), DESKTOP_FRONTEND_PORT (default 4201)
#        The frontend defaults to a different port than the web script so both
#        can run side by side.
# Database: FULL_STACK_DB=both|migrate|seed|none (default both)
#
# Backend path: same resolver as run-inventory-backend.sh
# Override: INVENTORY_BACKEND_DIR=/path/to/backend npm run start:desktop

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

SCRIPT_NAME="run-desktop"
# shellcheck source=stack-common.sh
source "${ROOT}/scripts/stack-common.sh"

API_PORT="${DESKTOP_API_PORT:-3999}"
FRONTEND_PORT="${DESKTOP_FRONTEND_PORT:-4201}"

free_listen_port "${API_PORT}" "bundled local API"
free_listen_port "${FRONTEND_PORT}" "frontend"

API_PID=""
FRONTEND_PID=""

cleanup() {
  # Restore first: it is the only step whose loss leaves the repo dirty, and a
  # later failure under `set -e` would otherwise skip it.
  runtime_config_restore "${ROOT}"
  stop_frontend "${FRONTEND_PID}" "${SCRIPT_NAME}" "${FRONTEND_PORT}"
  stop_backend "${API_PID}" "${SCRIPT_NAME}" "${API_PORT}"
}

trap cleanup INT TERM EXIT

# shellcheck source=resolve-inventory-backend-dir.sh
source "${ROOT}/scripts/resolve-inventory-backend-dir.sh" "${ROOT}"

# This is the one precondition the desktop shape has and web mode does not: the
# frontend calls the API cross-origin, so the API must allow it. The backend
# currently serves `cors()` unconditionally, but a real bundled API should be
# locked to the shell's origin — so verify rather than assume.
if ! grep -rq "cors" "${BACKEND_DIR}/app.js" 2>/dev/null; then
  echo "${SCRIPT_NAME}: the backend does not appear to enable CORS." >&2
  echo "${SCRIPT_NAME}: desktop mode calls the API by absolute URL, so it needs CORS." >&2
  echo "${SCRIPT_NAME}: enable it in ${BACKEND_DIR}/app.js, or use 'npm run start:web'." >&2
  exit 1
fi

prepare_backend_deps "${BACKEND_DIR}" "${SCRIPT_NAME}"

read -r run_migrate run_seed <<<"$(resolve_db_steps "${SCRIPT_NAME}")"
run_db_steps "${BACKEND_DIR}" "${run_migrate}" "${run_seed}" "${SCRIPT_NAME}"

export PORT="${API_PORT}"

echo "${SCRIPT_NAME}: starting bundled local API on port ${API_PORT}..."
bash "${ROOT}/scripts/run-inventory-backend.sh" &
API_PID=$!

sleep 1
if ! kill -0 "${API_PID}" 2>/dev/null; then
  echo "${SCRIPT_NAME}: API exited during startup; see messages above." >&2
  wait "${API_PID}" || true
  exit 1
fi

if ! wait_for_backend_http "${API_PORT}" "${SCRIPT_NAME}"; then
  kill "${API_PID}" 2>/dev/null || true
  wait "${API_PID}" 2>/dev/null || true
  exit 1
fi

runtime_config_prepare "${ROOT}" "http://127.0.0.1:${API_PORT}" "desktop" "${SCRIPT_NAME}"

echo "${SCRIPT_NAME}: starting Angular dev server (port ${FRONTEND_PORT})..."
echo "${SCRIPT_NAME}: open http://localhost:${FRONTEND_PORT}"
echo "${SCRIPT_NAME}: platform=desktop, apiBaseUrl=http://127.0.0.1:${API_PORT}"
echo "${SCRIPT_NAME}: no proxy.conf.json forwarding — requests go straight to the API, as they would from a shell."
# --proxy-config /dev/null disables proxy.conf.json: desktop mode must reach the
# API by absolute URL, not be silently rescued by a dev-only proxy.
echo "${SCRIPT_NAME}: press Ctrl-C to stop."
npm start -- --port "${FRONTEND_PORT}" --proxy-config /dev/null &
FRONTEND_PID=$!
wait "${FRONTEND_PID}" 2>/dev/null || true
