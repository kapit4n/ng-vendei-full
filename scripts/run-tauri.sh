#!/usr/bin/env bash
set -euo pipefail

# Launch the REAL Tauri desktop shell.
#
#   npm run tauri:dev
#
# Difference from `npm run start:desktop`, which stays exactly as it is:
#
#   start:desktop  browser-based *simulation* of a desktop run. Useful for E2E
#                  and for testing the frontend half (platform=desktop, absolute
#                  API URL, no proxy) without a Rust toolchain.
#   tauri:dev      the actual native window. The Angular app is loaded into a
#                  real Tauri webview, and Tauri owns the API's lifecycle.
#
# The Angular dev server is started by Tauri itself via `beforeDevCommand` in
# src-tauri/tauri.conf.json, not by this script — a Tauri dev run manages that
# child, and starting it here too would produce two servers on one port.
#
# This script owns what Tauri *cannot*: database preparation, and the Tauri CLI
# invocation. The Rust side then starts the API, waits for GET /api/health, and
# stops the API when the window closes.
#
# Ports: TAURI_API_PORT (default 3999 — the same default as DESKTOP_API_PORT),
#        and the Angular dev server port fixed at 4300 to match `devUrl` in
#        tauri.conf.json.
# Database: FULL_STACK_DB=both|migrate|seed|none (default both)
# Backend path: same resolver as the other start scripts.
# Override: INVENTORY_BACKEND_DIR=/path/to/backend npm run tauri:dev

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

SCRIPT_NAME="run-tauri"
# shellcheck source=stack-common.sh
source "${ROOT}/scripts/stack-common.sh"

API_PORT="${TAURI_API_PORT:-3999}"
# Must match `build.devUrl` in src-tauri/tauri.conf.json.
FRONTEND_PORT=4300

free_listen_port "${API_PORT}" "bundled local API"
free_listen_port "${FRONTEND_PORT}" "Angular dev server (Tauri)"

# shellcheck source=resolve-inventory-backend-dir.sh
source "${ROOT}/scripts/resolve-inventory-backend-dir.sh" "${ROOT}"

# Same precondition as run-desktop.sh: the webview calls the API cross-origin,
# so the API must allow it. Verify rather than assume — a real bundled API
# should be locked to the shell's origin, not open to everything.
if ! grep -rq "cors" "${BACKEND_DIR}/app.js" 2>/dev/null; then
  echo "${SCRIPT_NAME}: the backend does not appear to enable CORS." >&2
  echo "${SCRIPT_NAME}: the Tauri webview calls the API by absolute URL, so it needs CORS." >&2
  echo "${SCRIPT_NAME}: enable it in ${BACKEND_DIR}/app.js." >&2
  exit 1
fi

prepare_backend_deps "${BACKEND_DIR}" "${SCRIPT_NAME}"

read -r run_migrate run_seed <<<"$(resolve_db_steps "${SCRIPT_NAME}")"
run_db_steps "${BACKEND_DIR}" "${run_migrate}" "${run_seed}" "${SCRIPT_NAME}"

# Teardown.
#
# Killing the Tauri CLI is not enough. `npx tauri dev` spawns `cargo run`, which
# spawns the app binary, and it also spawns the `beforeDevCommand` Angular dev
# server as a separate child. Signalling only the CLI PID leaves both running, so
# the API and the dev server stay bound to their ports and the next run trips
# over them — the same grandchild problem stack-common.sh documents for
# `npm start`.
#
# So the CLI is started in its own process group (setsid) and the whole group is
# signalled. Port reclamation is kept as a backstop for the case where a
# descendant escaped the group.
TAURI_PID=""
TAURI_PGID=""
cleanup() {
  if [[ -n "${TAURI_PID}" ]] && kill -0 "${TAURI_PID}" 2>/dev/null; then
    echo "${SCRIPT_NAME}: stopping the Tauri process group..."
    # Negative pid signals the group; the CLI goes first so it can run its own
    # shutdown, then the group is swept.
    kill -TERM -- "-${TAURI_PGID}" 2>/dev/null || kill -TERM "${TAURI_PID}" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "${TAURI_PID}" 2>/dev/null || break
      sleep 0.25
    done
    kill -KILL -- "-${TAURI_PGID}" 2>/dev/null || true
    wait "${TAURI_PID}" 2>/dev/null || true
  fi
  free_listen_port "${API_PORT}" "bundled local API"
  free_listen_port "${FRONTEND_PORT}" "Angular dev server (Tauri)"
}
trap cleanup INT TERM EXIT

echo "${SCRIPT_NAME}: launching the Tauri shell (native window)."
echo "${SCRIPT_NAME}: Angular dev server will be started by Tauri on port ${FRONTEND_PORT}."
echo "${SCRIPT_NAME}: Tauri will start the API on port ${API_PORT} and wait for /api/health."
echo "${SCRIPT_NAME}: platform=desktop, apiBaseUrl=http://127.0.0.1:${API_PORT}, no proxy."
echo "${SCRIPT_NAME}: close the window to stop the API; press Ctrl-C to abort the build."

# The Rust side reads the backend location from the environment rather than
# hardcoding a path, so the shell has no build-time knowledge of where the API
# lives — the same rule the frontend follows.
export VENDEI_BACKEND_DIR="${BACKEND_DIR}"
export VENDEI_API_PORT="${API_PORT}"
export VENDEI_MANAGE_BACKEND=1

# `setsid` puts the CLI in a new process group and prints its pgid. Its own
# process group id equals the CLI's pid once it is the group leader.
setsid npx tauri dev &
TAURI_PID=$!
TAURI_PGID="${TAURI_PID}"
wait "${TAURI_PID}" 2>/dev/null || true
