#!/usr/bin/env bash
set -euo pipefail

# Start the app the way a server deployment runs it: browser platform, API
# same-origin. This is the mode users hit in production behind nginx.
#
#   npm run start:web
#
# The bundle is identical to the desktop run — only `runtime-config.js`
# differs, which is the point: no build-time branch on deployment target.
#
# Two ways to serve it, matching how it is actually deployed:
#
#   MODE=dev   (default) Angular dev server on :4200, proxy.conf.json forwards
#              collection paths to the backend. Same-origin, like nginx.
#   MODE=prod  production build served over HTTP with a small static server
#              that mimics the nginx rules (SPA fallback, runtime-config no-store).
#
# Ports: WEB_BACKEND_PORT (default 3000), WEB_FRONTEND_PORT (default 4200)
# Database: FULL_STACK_DB=both|migrate|seed|none (default both)
#
# Backend path: same resolver as run-inventory-backend.sh
# Override: INVENTORY_BACKEND_DIR=/path/to/backend npm run start:web

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

SCRIPT_NAME="run-web"
# shellcheck source=stack-common.sh
source "${ROOT}/scripts/stack-common.sh"

BACKEND_PORT="${WEB_BACKEND_PORT:-3000}"
FRONTEND_PORT="${WEB_FRONTEND_PORT:-4200}"
MODE="${MODE:-dev}"

case "${MODE}" in
  dev|prod) ;;
  *)
    echo "${SCRIPT_NAME}: invalid MODE=${MODE} (use dev|prod)" >&2
    exit 1
    ;;
esac

free_listen_port "${BACKEND_PORT}" "inventory backend"
free_listen_port "${FRONTEND_PORT}" "frontend"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  # Restore first: it is the only step whose loss leaves the repo dirty, and a
  # later failure under `set -e` would otherwise skip it.
  runtime_config_restore "${ROOT}"
  stop_frontend "${FRONTEND_PID}" "${SCRIPT_NAME}" "${FRONTEND_PORT}"
  stop_backend "${BACKEND_PID}" "${SCRIPT_NAME}" "${BACKEND_PORT}"
}

trap cleanup INT TERM EXIT

# shellcheck source=resolve-inventory-backend-dir.sh
source "${ROOT}/scripts/resolve-inventory-backend-dir.sh" "${ROOT}"

prepare_backend_deps "${BACKEND_DIR}" "${SCRIPT_NAME}"

read -r run_migrate run_seed <<<"$(resolve_db_steps "${SCRIPT_NAME}")"
run_db_steps "${BACKEND_DIR}" "${run_migrate}" "${run_seed}" "${SCRIPT_NAME}"

export PORT="${BACKEND_PORT}"

echo "${SCRIPT_NAME}: starting inventory backend (PORT=${PORT})..."
bash "${ROOT}/scripts/run-inventory-backend.sh" &
BACKEND_PID=$!

sleep 1
if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
  echo "${SCRIPT_NAME}: backend exited during startup; see messages above." >&2
  wait "${BACKEND_PID}" || true
  exit 1
fi

if ! wait_for_backend_http "${BACKEND_PORT}" "${SCRIPT_NAME}"; then
  kill "${BACKEND_PID}" 2>/dev/null || true
  wait "${BACKEND_PID}" 2>/dev/null || true
  exit 1
fi

if [[ "${MODE}" == "dev" ]]; then
  # Same-origin: empty apiBaseUrl means requests go to the dev server's own
  # origin, and proxy.conf.json forwards them to the backend — the dev
  # equivalent of nginx proxying to `backend:3000`.
  runtime_config_prepare "${ROOT}" "" "browser" "${SCRIPT_NAME}"

  echo "${SCRIPT_NAME}: starting Angular dev server (port ${FRONTEND_PORT})..."
  echo "${SCRIPT_NAME}: open http://localhost:${FRONTEND_PORT}"
  echo "${SCRIPT_NAME}: platform=browser, apiBaseUrl='' (same-origin via proxy.conf.json)"
  echo "${SCRIPT_NAME}: press Ctrl-C to stop."
  npm start -- --port "${FRONTEND_PORT}" &
  FRONTEND_PID=$!
  wait "${FRONTEND_PID}" 2>/dev/null || true
  exit 0
fi

# Production build: bake in the build-time defaults, then serve the output the
# way nginx would. runtime-config.js is written into dist (not into src), so
# src/ stays clean and there is nothing to restore on exit.
echo "${SCRIPT_NAME}: building for production..."
npx ng build --configuration production

DIST_DIR="${ROOT}/dist/ng-vendei-full"
if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  echo "${SCRIPT_NAME}: build did not produce ${DIST_DIR}/index.html" >&2
  exit 1
fi

runtime_config_prepare "${ROOT}" "" "browser" "${SCRIPT_NAME}"
cp "${ROOT}/${RUNTIME_CONFIG_REL}" "${DIST_DIR}/assets/config/runtime-config.js"

echo "${SCRIPT_NAME}: serving production build on port ${FRONTEND_PORT}..."
echo "${SCRIPT_NAME}: open http://localhost:${FRONTEND_PORT}"
echo "${SCRIPT_NAME}: platform=browser, apiBaseUrl='' (same-origin)"
# --api-target lets the static server proxy the same paths nginx proxies, so a
# production-mode check still reaches the backend without nginx installed.
WEB_API_TARGET="http://127.0.0.1:${BACKEND_PORT}" \
  node "${ROOT}/scripts/serve-static.mjs" "${DIST_DIR}" "${FRONTEND_PORT}"
