#!/usr/bin/env bash
set -euo pipefail

# Verify that the REAL Tauri shell starts a native window and owns the API
# lifecycle. Complements scripts/run-tauri.sh, which is the thing a developer
# runs; this one asserts and reports, and always cleans up.
#
#   bash scripts/verify-tauri.sh
#
# What it checks, in order:
#   1. the Tauri binary builds (cargo check)
#   2. the Rust unit tests pass
#   3. the API health endpoint answers before anything waits on it
#   4. `npm run tauri:dev` starts and the API becomes ready
#   5. a native window titled "Vendei" exists, is viewable, and has painted a
#      real UI rather than a blank webview
#   6. the webview really talked to the API (Angular bootstrap in the log)
#   7. closing the window gracefully stops the API — the user path, not Ctrl-C
#   8. nothing is left listening on the ports afterwards
#
# Why it does not drive the UI: Tauri E2E needs tauri-driver plus
# WebKitWebDriver, neither of which is installed here. The existing Playwright
# suite keeps covering the UI against the browser desktop simulation
# (`npm run start:desktop`), which loads the identical Angular bundle. What this
# script adds is proof that the *shell* works, which Playwright cannot see.
#
# Step 7 sends a real WM_DELETE_WINDOW, i.e. what a window manager forwards
# when a user clicks the titlebar close button. Signalling the process group
# instead — as run-tauri.sh does for Ctrl-C — would NOT test this: SIGTERM is
# fatal to a Rust process by default, so the exit hook never runs and only the
# PR_SET_PDEATHSIG backstop prevents the leak. Both paths matter, and the group
# signal is still used below as the fallback teardown that guarantees cleanup.
#
# DISPLAY must be set to a real X server; there is no Xvfb fallback here
# because a window that was never mapped proves nothing.
# Steps needing absent tooling (wmctrl/xdotool, xwd/ffmpeg, gcc) skip loudly
# rather than passing silently.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

SCRIPT_NAME="verify-tauri"
API_PORT="${TAURI_API_PORT:-3999}"
FRONTEND_PORT=4300
WINDOW_TITLE="${TAURI_WINDOW_TITLE:-Vendei}"
LOG="$(mktemp -t tauri-verify.XXXXXX.log)"

# shellcheck source=stack-common.sh
source "${ROOT}/scripts/stack-common.sh"

FAILURES=0
pass() { printf '  \033[32mPASS\033[0m %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAILURES=$((FAILURES + 1)); }
skip() { printf '  \033[33mSKIP\033[0m %s\n' "$1"; }

# Print the id of a viewable window whose title matches, ignoring the tiny
# unmapped helper windows webview toolkits create under the same process.
find_window() {
  local title="$1" id info
  while read -r id; do
    [[ -z "${id}" ]] && continue
    info="$(xwininfo -id "${id}" -display "${DISPLAY}" 2>/dev/null || true)"
    grep -q "Map State: IsViewable" <<<"${info}" || continue
    local width height
    width="$(awk '/^ +Width:/ {print $2}' <<<"${info}")"
    height="$(awk '/^ +Height:/ {print $2}' <<<"${info}")"
    [[ -z "${width:-}" || -z "${height:-}" ]] && continue
    ((width < 800 || height < 600)) && continue
    local name
    name="$(xprop -id "${id}" _NET_WM_NAME 2>/dev/null | sed 's/^[^=]*= *//')"
    name="${name%\"}"; name="${name#\"}"
    [[ "${name}" == "${title}" ]] && { echo "${id}"; return 0; }
  done < <(xwininfo -root -children -display "${DISPLAY}" 2>/dev/null | awk '/^ +0x[0-9a-f]+ /{print $1}')
  return 1
}

# CLOSER: a command that takes a window title and requests a graceful close.
# Prefers the standard tools, falls back to compiling scripts/x11-wm-close.c.
# Empty when no route exists, so the caller can skip instead of pretending.
CLOSER=""
CLOSER_BIN=""
find_closer() {
  if command -v wmctrl >/dev/null 2>&1; then
    CLOSER="wmctrl -c"
    return 0
  fi
  if command -v xdotool >/dev/null 2>&1; then
    CLOSER="xdotool search --name"
    return 0
  fi
  if command -v gcc >/dev/null 2>&1 && [[ -f /usr/include/X11/Xlib.h ]]; then
    CLOSER_BIN="$(mktemp -t wmclose.XXXXXX)"
    if gcc -O2 -o "${CLOSER_BIN}" "${ROOT}/scripts/x11-wm-close.c" -lX11 2>/dev/null; then
      CLOSER="${CLOSER_BIN}"
      return 0
    fi
    rm -f "${CLOSER_BIN}"
  fi
  CLOSER=""
  return 1
}

# `xdotool search --name T` prints ids, it does not close them, so it needs a
# second verb; keep the two shapes in one helper.
close_window() {
  local title="$1"
  if [[ "${CLOSER}" == "xdotool search --name" ]]; then
    local id
    for id in $(${CLOSER} -- "${title}" 2>/dev/null); do
      xdotool windowclose "${id}" 2>/dev/null && return 0
    done
    return 1
  fi
  ${CLOSER} "${title}" >/dev/null 2>&1
}

# Decide whether a captured window looks like a rendered UI rather than a
# blank or errored webview.
#
# A webview that failed to load, or an Angular app that threw during bootstrap,
# paints one flat colour: a handful of distinct pixels and a luma range near
# zero. The POS shell paints a light chrome, dark text and product photography,
# so it shows a wide palette and nearly the full luma range. Thresholds are
# deliberately loose — the point is to catch "nothing was drawn", not to police
# the design.
#
# Two independent signals, because either alone can mislead:
#   colors  distinct RGB triples, i.e. real palette breadth. A flat page has a
#           handful; the POS has thousands.
#   range   luma range, 0.299r+0.587g+0.114b, min to max. Catches a page that
#           is one bright colour with a single dark widget.
#
# Luma min/max rather than standard deviation on purpose: it needs no sqrt(),
# which mawk only grew in 1.3.4.
#
# Prints "<verdict> colors=<n> range=<n>" where verdict is PAINTED, BLANK or
# ERROR, and always returns 0. A verdict string rather than an exit status,
# because `set -e` kills the script on a failing command substitution before
# the caller could inspect `$?`. Requires xwd + ffmpeg.
window_has_painted() {
  local id="$1" dump raw
  dump="$(mktemp -t wm-dump.XXXXXX.xwd)"
  raw="$(mktemp -t wm-raw.XXXXXX)"

  if ! xwd -id "${id}" -display "${DISPLAY}" -out "${dump}" 2>/dev/null; then
    rm -f "${dump}" "${raw}"
    echo "ERROR xwd could not read the window"
    return 0
  fi
  # Downscale before measuring: enough to prove content, small enough to do it
  # with od + awk alone (no ImageMagick or numpy dependency). 120x80 keeps a
  # few thousand pixels, which still resolves a text-heavy layout.
  if ! ffmpeg -v error -i "${dump}" -vf scale=120:80 -pix_fmt rgb24 -f rawvideo -y "${raw}" 2>/dev/null \
    || [[ ! -s "${raw}" ]]; then
    rm -f "${dump}" "${raw}"
    echo "ERROR ffmpeg could not decode the capture"
    return 0
  fi
  rm -f "${dump}"

  # `paste - - -` folds the flat byte stream back into RGB triples, so the
  # unique count is of colours rather than of individual channel values.
  local colors range
  colors="$(od -An -tu1 -v "${raw}" | tr -s ' ' '\n' | grep -v '^$' \
    | paste -d' ' - - - | sort -u | wc -l | tr -d ' ')"
  range="$(od -An -tu1 -v "${raw}" | tr -s ' ' '\n' | grep -v '^$' \
    | paste -d' ' - - - \
    | awk '{l=0.299*$1+0.587*$2+0.114*$3; if (NR==1){mn=l; mx=l} if (l<mn) mn=l; if (l>mx) mx=l}
             END{printf "%.0f", (NR? mx-mn : 0)}')"
  rm -f "${raw}"

  if [[ -z "${colors}" || -z "${range}" || "${colors}" == "0" ]]; then
    echo "ERROR the capture decoded to nothing"
    return 0
  fi
  if ((colors > 400 && range > 60)); then
    echo "PAINTED colors=${colors} range=${range}"
  else
    echo "BLANK colors=${colors} range=${range}"
  fi
  return 0
}

TAURI_PID=""
cleanup() {
  if [[ -n "${TAURI_PID}" ]] && kill -0 "${TAURI_PID}" 2>/dev/null; then
    # Signal the group, not just the CLI: `npx tauri dev` owns the cargo/app
    # process and the Angular dev server, and killing only the CLI orphans both.
    kill -TERM -- "-${TAURI_PID}" 2>/dev/null || kill -TERM "${TAURI_PID}" 2>/dev/null || true
    wait "${TAURI_PID}" 2>/dev/null || true
  fi
  # Reclaim both ports: the point of the check is that the shell leaves nothing
  # behind, and this guarantees the next run starts clean even on failure.
  free_listen_port "${API_PORT}" "bundled local API"
  free_listen_port "${FRONTEND_PORT}" "Angular dev server (Tauri)"
  [[ -n "${CLOSER_BIN:-}" ]] && rm -f "${CLOSER_BIN}"
}
trap cleanup INT TERM EXIT

echo "== 1. Tauri project builds"
if (cd "${ROOT}/src-tauri" && cargo check --quiet 2>>"${LOG}"); then
  pass "cargo check"
else
  fail "cargo check (see ${LOG})"
fi

echo "== 2. Rust unit tests"
if (cd "${ROOT}/src-tauri" && cargo test --quiet 2>>"${LOG}"); then
  pass "cargo test"
else
  fail "cargo test (see ${LOG})"
fi

if [[ -z "${DISPLAY:-}" ]]; then
  echo "  \033[33mSKIP\033[0m window checks: DISPLAY is not set (a real X server is required)"
  echo
  echo "Result: $FAILURES failure(s). Log: ${LOG}"
  exit "${FAILURES}"
fi

echo "== 3. Launching the Tauri shell"
free_listen_port "${API_PORT}" "bundled local API"
free_listen_port "${FRONTEND_PORT}" "Angular dev server (Tauri)"

FULL_STACK_DB="${FULL_STACK_DB:-none}" setsid npm run tauri:dev >"${LOG}" 2>&1 &
TAURI_PID=$!

# Readiness of the API is the shell's own job; here we only wait long enough to
# observe the outcome. The shell polls /api/health itself, so a fixed wait in
# this script cannot make a broken shell look healthy.
if wait_for_backend_http "${API_PORT}" "${SCRIPT_NAME}" 240; then
  pass "API is serving on port ${API_PORT}"
else
  fail "API never became ready on port ${API_PORT} (see ${LOG})"
fi

echo "== 4. Health endpoint"
if health="$(curl -sf --max-time 5 "http://127.0.0.1:${API_PORT}/api/health")" \
  && grep -q '"status"' <<<"${health}"; then
  pass "GET /api/health -> ${health}"
else
  fail "GET /api/health did not return a status (see ${LOG})"
fi

echo "== 5. Native window"
# A webview toolkit also creates small hidden helper windows (10x10, never
# mapped) under the same process, and a window manager may add a decoration
# frame with a different name. So match on the title, then require the window to
# be viewable and of a plausible size — a 10x10 unmapped window would otherwise
# pass a title check and prove nothing.
WINDOW_ID=""
for _ in $(seq 1 40); do
  WINDOW_ID="$(find_window "${WINDOW_TITLE}")"
  [[ -n "${WINDOW_ID}" ]] && break
  sleep 0.5
done

if [[ -n "${WINDOW_ID}" ]]; then
  pass "window \"${WINDOW_TITLE}\" exists (${WINDOW_ID})"
  geometry="$(xwininfo -id "${WINDOW_ID}" -display "${DISPLAY}" 2>/dev/null || true)"
  if grep -q "Map State: IsViewable" <<<"${geometry}"; then
    pass "window is mapped and viewable"
  else
    fail "window exists but is not viewable"
  fi
  width="$(awk '/^ +Width:/ {print $2}' <<<"${geometry}")"
  height="$(awk '/^ +Height:/ {print $2}' <<<"${geometry}")"
  if [[ -n "${width:-}" && -n "${height:-}" && "${width}" -ge 800 && "${height}" -ge 600 ]]; then
    pass "window geometry is ${width}x${height}"
  else
    fail "window geometry looks wrong: ${width:-?}x${height:-?}"
  fi

  # A viewable window only proves the shell opened; it does not prove Angular
  # rendered inside it. A webview showing a load failure is equally viewable,
  # and would still pass every check above, so look at the pixels.
  #
  # The window appears as soon as the API is healthy, which can be well before
  # `ng serve` has finished its first build, so the first captures may catch a
  # page that has not painted yet. Retry briefly: the requirement is that the
  # UI *does* render, not that it renders within one poll interval.
  if command -v xwd >/dev/null 2>&1 && command -v ffmpeg >/dev/null 2>&1; then
    paint=""
    for _ in $(seq 1 10); do
      paint="$(window_has_painted "${WINDOW_ID}")"
      [[ "${paint}" == PAINTED* ]] && break
      [[ "${paint}" == ERROR* ]] && break
      sleep 3
    done
    case "${paint}" in
      PAINTED*) pass "window painted the UI (${paint#PAINTED })" ;;
      BLANK*) fail "window looks blank — Angular did not render (${paint#BLANK })" ;;
      *) skip "window pixel check: ${paint#ERROR }" ;;
    esac
  else
    skip "window pixel check: xwd and ffmpeg are required"
  fi
else
  fail "no viewable window titled \"${WINDOW_TITLE}\" on ${DISPLAY} (see ${LOG})"
fi

if pgrep -f "target/debug/vendei" >/dev/null 2>&1 \
  || pgrep -f "target/.*/vendei" >/dev/null 2>&1; then
  pass "Tauri process is running"
else
  fail "no Tauri process found"
fi

echo "== 6. The webview reached the API"
# The Angular dev server proxies nothing in desktop mode, so any /storeProfiles
# line in the log can only have come from the webview following the absolute
# apiBaseUrl the shell injected.
if grep -qE "GET /(storeProfiles|products|productPresentations|categories)" "${LOG}"; then
  pass "API served requests originating from the Tauri webview"
else
  fail "no API requests from the webview in the log (see ${LOG})"
fi

echo "== 7. Closing the window stops the API"
# The user path, as opposed to the Ctrl-C teardown below. The shell logs the
# backend shutdown, which is the observable proof that stop_backend ran rather
# than the kernel's parent-death signal doing it by accident.
API_BEFORE="$(lsof -t -iTCP:"${API_PORT}" -sTCP:LISTEN 2>/dev/null | head -1 || true)"
if [[ -z "${API_BEFORE}" ]]; then
  fail "no API process on port ${API_PORT} to close"
elif find_closer; then
  if close_window "${WINDOW_TITLE}"; then
    pass "sent a window-close request to \"${WINDOW_TITLE}\""
  else
    fail "could not send a window-close request (see ${LOG})"
  fi

  for _ in $(seq 1 60); do
    kill -0 "${API_BEFORE}" 2>/dev/null || break
    sleep 0.5
  done

  if kill -0 "${API_BEFORE}" 2>/dev/null; then
    fail "API pid ${API_BEFORE} survived the window close"
  else
    pass "closing the window stopped the API (pid ${API_BEFORE})"
  fi

  if grep -q "stopping the bundled API" "${LOG}"; then
    pass "the shell tore the API down itself (stop_backend ran)"
  else
    fail "the API died without stop_backend running — see the PR_SET_PDEATHSIG note in src-tauri/src/main.rs"
  fi
else
  skip "graceful close: no wmctrl, xdotool, or gcc + X11 headers available"
fi

echo "== 8. Shutdown leaves nothing behind"
# Signal the group so the CLI, the app binary and the dev server all stop — this
# is the check that caught the orphaned-children bug in the first place, and it
# is idempotent when step 7 already closed the window gracefully.
kill -TERM -- "-${TAURI_PID}" 2>/dev/null || kill -TERM "${TAURI_PID}" 2>/dev/null || true
for _ in $(seq 1 40); do
  kill -0 "${TAURI_PID}" 2>/dev/null || break
  sleep 0.25
done
wait "${TAURI_PID}" 2>/dev/null || true
TAURI_PID=""
sleep 3

for port in "${API_PORT}" "${FRONTEND_PORT}"; do
  if lsof -t -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "something is still listening on port ${port}"
  else
    pass "port ${port} released"
  fi
done

# The ports are the contract, but a stray node holding no listener would still
# be an orphan, so check for the processes themselves too.
if pgrep -f "target/debug/vendei" >/dev/null 2>&1 \
  || pgrep -f "target/.*/vendei" >/dev/null 2>&1; then
  fail "a vendei process is still running"
else
  pass "no vendei process left behind"
fi

echo
if ((FAILURES == 0)); then
  printf '\033[32mAll Tauri checks passed.\033[0m Log: %s\n' "${LOG}"
else
  printf '\033[31m%d check(s) failed.\033[0m Log: %s\n' "${FAILURES}" "${LOG}"
fi
exit "${FAILURES}"
