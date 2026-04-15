#!/usr/bin/env bash
set -euo pipefail

# Run the inventory backend from a sibling directory of this repo (same parent as ng-vendei-full).
# Override the backend path: INVENTORY_BACKEND_DIR=/path/to/backend npm run inventory-backend

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=resolve-inventory-backend-dir.sh
source "${ROOT}/scripts/resolve-inventory-backend-dir.sh" "${ROOT}"

cd "${BACKEND_DIR}"

if [[ ! -d node_modules ]]; then
  echo "run-inventory-backend: installing dependencies in ${BACKEND_DIR}..."
  npm install
fi

echo "run-inventory-backend: starting ${BACKEND_DIR} (npm start)"
exec npm start
