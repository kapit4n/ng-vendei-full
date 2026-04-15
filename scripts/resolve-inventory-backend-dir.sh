# Resolve inventory backend directory (sibling of ng-vendei-full).
# Usage: source "$(dirname "$0")/resolve-inventory-backend-dir.sh" "$NG_VENDEI_ROOT"
# Sets BACKEND_DIR. Honors INVENTORY_BACKEND_DIR. Exits 1 on failure.

ng_vendei_root="${1:?ng-vendei root required}"
parent="$(cd "${ng_vendei_root}/.." && pwd)"

if [[ -n "${INVENTORY_BACKEND_DIR:-}" ]]; then
  BACKEND_DIR="${INVENTORY_BACKEND_DIR}"
elif [[ -d "${parent}/inventory-cod" ]]; then
  BACKEND_DIR="${parent}/inventory-cod"
elif [[ -d "${parent}/inventory-nod" ]]; then
  BACKEND_DIR="${parent}/inventory-nod"
else
  echo "resolve-inventory-backend-dir: no backend found next to ${ng_vendei_root}." >&2
  echo "Expected ${parent}/inventory-cod or ${parent}/inventory-nod, or set INVENTORY_BACKEND_DIR." >&2
  exit 1
fi

if [[ ! -d "${BACKEND_DIR}" ]]; then
  echo "resolve-inventory-backend-dir: not a directory: ${BACKEND_DIR}" >&2
  exit 1
fi

if [[ ! -f "${BACKEND_DIR}/package.json" ]]; then
  echo "resolve-inventory-backend-dir: no package.json in ${BACKEND_DIR}" >&2
  exit 1
fi
