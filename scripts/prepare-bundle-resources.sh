#!/usr/bin/env bash
# Populate the inputs a Tauri bundle needs, so `tauri build` works the same on a
# developer machine and in CI.
#
# A Tauri bundle is a single directory that must contain everything the app runs:
# the Angular bundle, the Node API, and a Node runtime. The API lives in a
# separate repository and Node has to be downloaded, so both are staged under
# src-tauri/ and declared in tauri.conf.json's `bundle.resources`.
#
# Every step is idempotent, so this is safe to run on every build.
#
#   scripts/prepare-bundle-resources.sh                 # stage anything missing
#   scripts/prepare-bundle-resources.sh --backend-ref <git-ref>
#   scripts/prepare-bundle-resources.sh --skip-backend --skip-runtime
#   scripts/prepare-bundle-resources.sh --force          # re-stage from scratch
#
# Environment overrides: BACKEND_REPO, BACKEND_REF, NODE_VERSION.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAURI_DIR="$ROOT/src-tauri"
BACKEND_DIR="$TAURI_DIR/backend"
RUNTIME_DIR="$TAURI_DIR/runtime"
STAMP_DIR="$TAURI_DIR/.bundle-stamps"

# Accepted with or without a leading "v", because the workflow passes 22.23.3
# while the dist URLs need v22.23.3. A mismatch here is a silent 404 several
# steps later, which is exactly how the first installer run failed.
NODE_VERSION_RAW="${NODE_VERSION:-v22.23.3}"
NODE_VERSION="${NODE_VERSION_RAW#v}"
NODE_VERSION="v$NODE_VERSION"

# Checksums from https://nodejs.org/dist/v22.23.3/SHASUMS256.txt. Verifying the
# tarball is what stops a compromised mirror from becoming a shipped runtime.
NODE_SHA_x64="df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de"
NODE_SHA_arm64="a44aeb94849a299b22df10b9e622ec2f605c2183501bc40590705131de7c740f"

BACKEND_REPO="${BACKEND_REPO:-https://github.com/kapit4n/inventory-nod.git}"
# The commit that adds GET /api/health, which the shell polls before showing the
# window. Cloning anything older yields a shell that waits forever.
BACKEND_REF="${BACKEND_REF:-d92301e8ac882459cdd9a97bf9353245c92b6316}"

# Matches the backend's own devDependency. Pinned here because the bundle needs
# it at runtime, which makes it a production concern for the installer even
# though the backend treats it as a development one.
SEQUELIZE_CLI_VERSION="${SEQUELIZE_CLI_VERSION:-6.6.2}"

# Files without which a packaged install cannot start. Checked after staging
# because a silently missing piece here only shows up as an empty window on
# someone else's machine.
REQUIRED_BACKEND_PATHS=(
  "bin/www"
  "config/config.json"
  "models/index.js"
  "node_modules/sequelize-cli/lib/sequelize"
  "public/uploads"
)

want_backend=1
want_runtime=1
backend_ref="$BACKEND_REF"
force=0

while [ $# -gt 0 ]; do
  case "$1" in
    --backend-ref) backend_ref="${2:?--backend-ref needs a value}"; shift 2 ;;
    --backend-ref=*) backend_ref="${1#*=}"; shift ;;
    --skip-backend) want_backend=0; shift ;;
    --skip-runtime) want_runtime=0; shift ;;
    --force) force=1; shift ;;
    -h|--help) sed -n '2,25p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "prepare-bundle-resources: unknown option $1" >&2; exit 2 ;;
  esac
done

log() { echo "prepare-bundle-resources: $*"; }
die() { echo "prepare-bundle-resources: $*" >&2; exit 1; }

[ "$force" -eq 1 ] && rm -rf "$STAMP_DIR"
mkdir -p "$STAMP_DIR"

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo x64 ;;
    aarch64|arm64) echo arm64 ;;
    *) die "unsupported architecture $(uname -m); add it to this script with its checksum" ;;
  esac
}

expected_node_sha() {
  case "$1" in
    x64) echo "$NODE_SHA_x64" ;;
    arm64) echo "$NODE_SHA_arm64" ;;
  esac
}

stage_backend() {
  local stamp="$STAMP_DIR/backend"
  if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$backend_ref" ] && [ -d "$BACKEND_DIR" ]; then
    log "backend already staged at $backend_ref"
    return 0
  fi

  # Checked *before* any long download so a wrong ref fails in seconds. Without
  # this, an unreachable ref (a backend commit that was never pushed, say) only
  # surfaces after the clone and after npm has spent minutes fetching packages.
  if ! git ls-remote --exit-code "$BACKEND_REPO" >/dev/null 2>&1; then
    die "$BACKEND_REPO is not reachable; check BACKEND_REPO and network access"
  fi

  if [ ! -d "$BACKEND_DIR/.git" ]; then
    log "cloning $BACKEND_REPO at $backend_ref"
    rm -rf "$BACKEND_DIR"
    git clone --quiet "$BACKEND_REPO" "$BACKEND_DIR"
  else
    log "fetching $backend_ref"
    git -C "$BACKEND_DIR" fetch --quiet origin "$backend_ref" 2>/dev/null \
      || git -C "$BACKEND_DIR" fetch --quiet origin
  fi

  git -C "$BACKEND_DIR" checkout --quiet --force "$backend_ref"
  resolved="$(git -C "$BACKEND_DIR" rev-parse HEAD)"

  # `npm ci` needs the *exact* lockfile tree, and the backend's own tree has
  # peer conflicts too. It is staged with the same relaxation the frontend uses
  # (.npmrc is not committed here, because this is a different repository), so
  # keep the two in step rather than letting them diverge.
  log "installing backend production dependencies"
  ( cd "$BACKEND_DIR" && npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps >/dev/null )

  # sequelize-cli is a devDependency of the backend (it is only reached through
  # npm scripts there), but the shell runs it directly to migrate a fresh
  # install. --omit=dev therefore drops the very thing needed at first launch,
  # so it is added back as a production dependency.
  #
  # Deliberately *without* --omit=dev: npm honours that flag for an explicitly
  # named package by skipping the install entirely, which fails silently because
  # the command still exits 0.
  log "adding sequelize-cli for first-launch migrations"
  ( cd "$BACKEND_DIR" && npm install --no-save --no-audit --no-fund \
      --legacy-peer-deps "sequelize-cli@$SEQUELIZE_CLI_VERSION" >/dev/null )

  # Never ship the developer's database or git metadata: the first launch
  # creates its own, and a stale sqlite file would silently override it.
  rm -f "$BACKEND_DIR/database.sqlite"
  rm -rf "$BACKEND_DIR/.git"
  rm -f "$BACKEND_DIR/.gitignore" 2>/dev/null || true
  rm -f "$BACKEND_DIR/.gitattributes" 2>/dev/null || true

  local missing=()
  local rel
  for rel in "${REQUIRED_BACKEND_PATHS[@]}"; do
    [ -e "$BACKEND_DIR/$rel" ] || missing+=("$rel")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    die "the staged backend is incomplete; missing:
  ${missing[*]}
A packaged install cannot start without these."
  fi

  printf '%s' "$resolved" > "$stamp"
  log "backend staged at $resolved"
}

stage_runtime() {
  local arch node_bin
  arch="$(detect_arch)"
  node_bin="$RUNTIME_DIR/bin/node"

  if [ -x "$node_bin" ] && [ ! "$force" -eq 1 ]; then
    if [ "$("$node_bin" --version 2>/dev/null || true)" = "$NODE_VERSION" ]; then
      log "node $NODE_VERSION already staged"
      return 0
    fi
  fi

  local tarball="node-${NODE_VERSION}-linux-${arch}.tar.xz"
  local url="https://nodejs.org/dist/${NODE_VERSION}/${tarball}"
  local want; want="$(expected_node_sha "$arch")"

  log "downloading $tarball"
  rm -rf "$RUNTIME_DIR"
  mkdir -p "$RUNTIME_DIR"
  curl --fail --silent --show-error --location "$url" -o "$RUNTIME_DIR/$tarball"

  local got; got="$(sha256sum "$RUNTIME_DIR/$tarball" | cut -d' ' -f1)"
  [ "$got" = "$want" ] || die "checksum mismatch for $tarball
  expected $want
  actual   $got
Refusing to bundle an unverified Node runtime."

  log "extracting node $NODE_VERSION ($arch)"
  tar -xJf "$RUNTIME_DIR/$tarball" -C "$RUNTIME_DIR" --strip-components=1 \
    --exclude '*/include' --exclude '*/share' --exclude 'CHANGELOG.md' --exclude 'LICENSE'
  rm -f "$RUNTIME_DIR/$tarball"

  [ -x "$node_bin" ] || die "expected $node_bin after extraction"
  log "node runtime staged: $("$node_bin" --version)"
}

[ "$want_backend" -eq 1 ] && stage_backend
[ "$want_runtime" -eq 1 ] && stage_runtime

if [ -e "$BACKEND_DIR" ] && [ ! -d "$BACKEND_DIR" ]; then
  die "$BACKEND_DIR exists but is not a directory"
fi

log "bundle resources ready"
