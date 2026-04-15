#!/usr/bin/env bash
set -euo pipefail

# Start the inventory backend (sibling repo) and the Angular dev server together.
# Backend path: same as scripts/run-inventory-backend.sh (inventory-cod, else inventory-nod sibling).
# Override: INVENTORY_BACKEND_DIR=/path/to/backend npm run start:full
# Ports: FULL_STACK_BACKEND_PORT (default 3000), FULL_STACK_FRONTEND_PORT (default 4200)
#
# Database (backend repo): before npm start, optionally run db:migrate / db:seed.
#   FULL_STACK_DB — primary switch (default: both):
#     both   — migrate then seed
#     migrate — migrate only
#     seed   — seed only
#     none   — skip migrate and seed (backend prestart may still migrate on npm start)
#   If FULL_STACK_DB is unset, legacy toggles (default: run both):
#     FULL_STACK_SKIP_MIGRATE=1 — skip migrate (seed still runs)
#     FULL_STACK_SKIP_SEED=1    — skip seed (migrate still runs)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

BACKEND_PORT="${FULL_STACK_BACKEND_PORT:-3000}"
FRONTEND_PORT="${FULL_STACK_FRONTEND_PORT:-4200}"

free_listen_port() {
  local port="$1"
  local label="$2"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -t -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  fi

  if [[ -n "${pids}" ]]; then
    echo "run-full-stack: stopping ${label} on port ${port} (PIDs: ${pids//$'\n'/ })..."
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
    sleep 0.4
    pids="$(lsof -t -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      # shellcheck disable=SC2086
      kill -9 ${pids} 2>/dev/null || true
    fi
    return
  fi

  if command -v fuser >/dev/null 2>&1 && fuser "${port}/tcp" >/dev/null 2>&1; then
    echo "run-full-stack: stopping ${label} on port ${port} (fuser)..."
    fuser -k "${port}/tcp" 2>/dev/null || true
    sleep 0.4
  fi
}

free_listen_port "${BACKEND_PORT}" "inventory backend"
free_listen_port "${FRONTEND_PORT}" "Angular dev server"

wait_for_backend_http() {
  local port="$1"
  local n=0
  local max=80
  while (( n < max )); do
    if curl -sf -o /dev/null "http://127.0.0.1:${port}/categories" 2>/dev/null; then
      echo "run-full-stack: backend is listening on port ${port}"
      return 0
    fi
    sleep 0.25
    n=$((n + 1))
  done
  echo "run-full-stack: timed out waiting for backend on port ${port}" >&2
  return 1
}

BACKEND_PID=""

cleanup() {
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    echo ""
    echo "run-full-stack: stopping backend (PID ${BACKEND_PID})..."
    kill "${BACKEND_PID}" 2>/dev/null || true
    wait "${BACKEND_PID}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

# shellcheck source=resolve-inventory-backend-dir.sh
source "${ROOT}/scripts/resolve-inventory-backend-dir.sh" "${ROOT}"

if [[ ! -d "${BACKEND_DIR}/node_modules" ]]; then
  echo "run-full-stack: installing backend dependencies in ${BACKEND_DIR}..."
  (cd "${BACKEND_DIR}" && npm install)
fi

run_migrate=0
run_seed=0

if [[ -n "${FULL_STACK_DB:-}" ]]; then
  case "${FULL_STACK_DB}" in
    both|all)
      run_migrate=1
      run_seed=1
      ;;
    migrate|migrations)
      run_migrate=1
      ;;
    seed|seeds)
      run_seed=1
      ;;
    none|off|skip)
      ;;
    *)
      echo "run-full-stack: invalid FULL_STACK_DB=${FULL_STACK_DB} (use both|migrate|seed|none)" >&2
      exit 1
      ;;
  esac
else
  run_migrate=1
  run_seed=1
  [[ "${FULL_STACK_SKIP_MIGRATE:-}" == "1" ]] && run_migrate=0
  [[ "${FULL_STACK_SKIP_SEED:-}" == "1" ]] && run_seed=0
fi

if [[ "${run_migrate}" == "1" ]]; then
  echo "run-full-stack: db:migrate in ${BACKEND_DIR}..."
  (cd "${BACKEND_DIR}" && npm run db:migrate)
else
  echo "run-full-stack: skipping db:migrate"
fi

if [[ "${run_seed}" == "1" ]]; then
  echo "run-full-stack: db:seed in ${BACKEND_DIR}..."
  (cd "${BACKEND_DIR}" && npm run db:seed)
else
  echo "run-full-stack: skipping db:seed"
fi

export PORT="${BACKEND_PORT}"

echo "run-full-stack: starting inventory backend (PORT=${PORT})..."
bash "${ROOT}/scripts/run-inventory-backend.sh" &
BACKEND_PID=$!

sleep 1
if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
  echo "run-full-stack: backend exited during startup; see messages above." >&2
  wait "${BACKEND_PID}" || true
  exit 1
fi

if ! wait_for_backend_http "${BACKEND_PORT}"; then
  kill "${BACKEND_PID}" 2>/dev/null || true
  wait "${BACKEND_PID}" 2>/dev/null || true
  exit 1
fi

echo "run-full-stack: starting Angular dev server (port ${FRONTEND_PORT})..."
npm start -- --port "${FRONTEND_PORT}"
