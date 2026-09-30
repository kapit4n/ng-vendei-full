# Tauri desktop — progress

Live record of the Tauri desktop milestone. Newest state first; see
[target-architecture.md](target-architecture.md) for the standing design.

| | |
| --- | --- |
| Branch | `feat/tauri-desktop` |
| Starting commit | `e3acd236f78c65ecc0270e934286ffa297948d68` (`feat(catalog): use real photography for chicken-store products`) |
| Tauri | 2.12.0 (`tauri` 2.12.0, `tauri-build` 2.7.0, `tauri-cli` 2.12.0) |
| Shell | `src-tauri/`, binary-only Rust crate `vendei` |
| Toolchain used | rustc 1.97.1, webkit2gtk via Tauri 2 defaults |

---

## State

**Before this milestone:** no Tauri shell existed. `npm run start:desktop`
emulated the *shape* of a desktop run — `platform: 'desktop'`, API on its own
port (3999) reached by absolute URL with CORS instead of same-origin through a
proxy — but it did so in a normal browser window. The shell itself was
"documented only" in the target architecture.

**After this milestone:** a real Tauri 2 window runs the same Angular bundle and
owns the lifecycle of a local Node API. Both modes coexist.

```
                  ┌──────────────────────────────┐
npm run start:web │ browser → Angular → Node API │  unchanged
npm run start:desktop  │ browser → Angular → API:3999 │  unchanged (still useful for E2E)
npm run tauri:dev     │ Tauri → Angular → API:3999  │  NEW
                  └──────────────────────────────┘
```

The Angular application is untouched by the shell. No component was rewritten in
Rust, no business logic moved to Rust, and there is still no second frontend and
no build-time branch on deployment target.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run tauri:dev` | The real shell. Native window, owns the API lifecycle. |
| `bash scripts/verify-tauri.sh` | Asserts the shell works, then always cleans up. |
| `npm run start:desktop` | Browser simulation. Unchanged, still the E2E target. |
| `npm run start:web` / `start:web:prod` | Server-mode shapes. Unchanged. |

`run-tauri.sh` owns database preparation (`FULL_STACK_DB`, same resolver as the
other start scripts) and the Tauri CLI invocation. The Angular dev server is
started by **Tauri** via `beforeDevCommand`, not by the script — a Tauri dev run
manages that child, and starting it here too would put two servers on one port.

Ports: `TAURI_API_PORT` (default **3999**, the same default as `DESKTOP_API_PORT`)
and the Angular dev server fixed at **4300** to match `devUrl`.

### Teardown

`run-tauri.sh` starts the CLI with `setsid` and signals the whole process group.
Signalling only the CLI PID is not enough: `npx tauri dev` spawns `cargo run`
(which spawns the app binary) and the `beforeDevCommand` dev server as separate
children. Port reclamation is kept as a backstop.

---

## Angular integration

The bundle is loaded over HTTP in dev (`devUrl: http://localhost:4300`) and from
disk in production (`frontendDist: ../dist/ng-vendei-full`, which is the real
`outputPath` from `angular.json`, not a guess).

**No proxy in the Tauri path.** `start:tauri-frontend` passes
`--proxy-config /dev/null`. A desktop run that quietly resolved same-origin
requests through the dev proxy would look healthy while the absolute-URL path —
the one a real shell depends on — was broken.

### Configuration injection, and why it is done twice

`index.html` loads `assets/config/runtime-config.js` *before* the bundle, and
that file **assigns** `window.__VENDEI_CONFIG__` wholesale. So the shell cannot
set the global once at startup: the page would overwrite it with the browser
defaults and every API call would resolve against the wrong origin. The shell
therefore injects `Object.assign(window.__VENDEI_CONFIG__, { apiBaseUrl,
platform })`:

1. via `initialization_script`, which runs before any page script, closing the
   window between navigation start and the document's own scripts; and
2. via `on_page_load`, which runs after them and so wins over
   `runtime-config.js`. It is idempotent and also covers dev-server reloads.

`Object.assign` rather than a wholesale assignment, so a value a deployment
legitimately overrode (e.g. `assetsBaseUrl`) survives.

**Consequence worth knowing:** `tauri:dev` does not rewrite
`src/assets/config/runtime-config.js` at all, so unlike `start:web` and
`start:desktop` it cannot leave the tracked file dirty and needs no restore step.

---

## Backend lifecycle

```
Vendei (tauri)
  ├── spawn: node ./bin/www   (PORT=3999, own process group)
  ├── poll:   GET http://127.0.0.1:3999/api/health  until 200
  └── on window close: SIGTERM the API's process group, wait, SIGKILL after 5s
```

Node is spawned **directly**, not via `npm start`: `npm start` runs `prestart`
(a migration) and makes node a grandchild, so killing the wrapper would orphan
the API on its port — exactly the leak `stack-common.sh` has to work around for
the browser modes. Migration timing is left to `run-tauri.sh`.

Readiness is a real HTTP probe of `/api/health`, not a sleep. In the verified
run the API answered on **attempt 3**. A listening socket is not enough: routes
mount only after Express finishes booting.

`stop_backend` is idempotent and wired to `WindowEvent::Destroyed`,
`RunEvent::ExitRequested` and `RunEvent::Exit`, because a window close does not
reliably deliver all three.

### Abnormal exits

`stop_backend` covers a clean close. Nothing userspace runs when the process is
`SIGKILL`ed, its X connection is severed, or the machine loses power, so on Linux
the child is also spawned with `PR_SET_PDEATHSIG`: the kernel delivers `SIGTERM`
at the moment the parent dies. The `getppid` re-check in `pre_exec` closes the
classic race where the parent dies between `fork` and `prctl` and the signal is
never armed.

### Verified close behaviour

Sending a real `WM_DELETE_WINDOW` (what a window manager forwards on a titlebar
close click) produces:

```
vendei: stopping the bundled API (pid 77305)
vendei: bundled API exited: exit status: 0
```

`exit status: 0` — the API's own `SIGTERM` handler in `bin/www` ran. Both ports
released, no `vendei` process left. This is distinct from Ctrl-C, which signals
the process group directly; that path never reaches the Rust exit hook and is
kept covered separately as the backstop.

---

## API health endpoint

`GET /api/health` → `{"status":"ok"}`, added in `../inventory-nod`
(`routes/health.js`, mounted at `/api`).

Deliberately dependency-free, unauthenticated, and touches no database: it must
answer before any client is configured, and a probe should not be the thing that
fails on a slow disk.

---

## Platform detection

No second mechanism was introduced. `PlatformService` already treats the
presence of `__TAURI__` / `__TAURI_INTERNALS__` as `desktop`, and the shell also
sets `platform: 'desktop'` through the existing runtime-config channel. Both
paths resolve to `desktop` inside the real window.

`withGlobalTauri` is `false`: the app grants the webview nothing and needs
nothing, since the shell does its work in Rust.

## Capabilities

`src-tauri/capabilities/default.json` grants exactly one permission set:

```json
{ "identifier": "default", "windows": ["main"], "permissions": ["core:default"] }
```

No `tauri-plugin-*` crates are in `Cargo.toml`. The backend is started with
`std::process`, never from JavaScript, so there is **no** shell, filesystem, HTTP
or process permission to grant. The Angular UI is treated as untrusted content.

**No capability was added, and none is currently needed.** The CSP in
`tauri.conf.json` is the actual boundary: `default-src 'self'`, with
`connect-src` limited to `ipc:` and loopback (`http://127.0.0.1:*`,
`http://localhost:*`) so the API can be reached and nothing else can.

---

## Verification

`bash scripts/verify-tauri.sh` — all checks pass:

```
1. cargo check                                    PASS
2. cargo test                       5 passed     PASS
3. API serving on port 3999                      PASS
4. GET /api/health -> {"status":"ok"}            PASS
5. window "Vendei" exists, viewable, 1308x866    PASS
   window painted the UI (colors=3659 range=255) PASS
6. API served requests from the Tauri webview    PASS
7. window close -> stop_backend ran, API stopped PASS
8. ports 3999 + 4300 released, no orphan         PASS
```

Two checks are worth calling out because they close gaps:

- **The window pixel check.** A viewable window does not prove Angular
  rendered — a webview showing a load failure is equally viewable and would pass
  everything above. `window_has_painted` captures the window with `xwd`, decodes
  it with `ffmpeg`, and asserts palette breadth and luma range. It retries,
  because the window appears as soon as the API is healthy, which can precede
  `ng serve`'s first build.
- **The graceful close check.** Signalling the process group — what the earlier
  version of this script did — cannot test "closing the window stops the API",
  because `SIGTERM` is fatal to a Rust process by default and the exit hook never
  runs. `scripts/x11-wm-close.c` sends a genuine `WM_DELETE_WINDOW`
  (`wmctrl`/`xdotool` are used when installed) and the script then asserts the
  shell logged the shutdown itself.

### Tauri E2E is not automated, deliberately

Driving the Tauri webview needs `tauri-driver` plus `WebKitWebDriver`, neither
installed. Rather than weaken the existing suite, the division of labour is:

- **Playwright (20/20, unchanged)** covers the UI against `start:desktop`, which
  loads the identical Angular bundle with the identical
  `platform: 'desktop'` + absolute-URL configuration.
- **`verify-tauri.sh`** covers the shell: native window, pixels, API lifecycle,
  readiness, and process cleanup — none of which Playwright can observe.

The API-side log is the seam that ties them together: check 6 fails unless the
webview issued real requests (`/storeProfiles`, `/productPresentations`,
`/categories`) to the absolute API URL, which is only reachable if the shell's
injected config took effect.

---

## Known limitations

Carried over, unrelated to this milestone and **not** fixed here:

- The full Karma run (~758 specs) intermittently disconnects (`afterAll` throw).
  Scoped runs are the primary signal. `app/pages` as one 223-spec scope is large
  enough to hit it; its sub-scopes are green.
- `npm run format:check` still reports ~190 files.
- 21 lint warnings remain, all pre-existing and unrelated.

Introduced or accepted by this milestone:

- **No installer, no bundled Node.** `tauri:dev` requires a Rust toolchain and
  Node on the machine. Distribution is the next milestone.
- **`assets/config/runtime-config.js` is still served from disk in production
  builds.** The shell injects over it, so this is correct, but a packaged build
  would be cleaner with the config embedded.
- **The window is shown once the API answers, but `ng serve` may still be
  compiling**, so the first frames can be a blank page. The pixel check retries
  to tolerate this; a developer sees a brief white flash.
- **`config.csp` allows `http://127.0.0.1:*` and `http://localhost:*` in
  `connect-src`.** Necessary for the local API, but it is a range rather than the
  one port. Worth pinning once the port is fixed at packaging time.
- **CORS on the API is `*`.** Pre-existing and called out in `run-desktop.sh`: a
  real bundled API should be locked to the shell's origin.
- **`libc` is Linux-only** in `Cargo.toml`, so `PR_SET_PDEATHSIG` protection is
  Linux-only. macOS and Windows rely on the `terminate` fallback, which kills the
  child process but has no kernel-level guarantee against a grandchild. This
  milestone was validated on Linux.

## Out of scope here

Windows/Linux installers, GitHub Releases, auto-update, a bundled Node runtime,
a first-launch wizard, a database migration framework, PostgreSQL, and Docker
deployment. The database is still SQLite behind the Node API; no SQLite work
moved into Rust.

## Next milestone

**Production Tauri packaging with a bundled Node backend and local SQLite,
without requiring Node.js on the user's machine.** That means bundling the Node
runtime and `bin/www` as Tauri resources (or a single-executable app), resolving
the API path from `app.path().resource_dir()` instead of `VENDEI_BACKEND_DIR`,
pinning the port, and locking the API's CORS to the shell's origin.

## Commits

Focused, in order:

```
docs: record the tauri milestone starting point
feat: add the tauri desktop shell
feat: add an api health endpoint for readiness
feat: launch the angular app in tauri development mode
test: verify the tauri shell owns the api lifecycle
docs: document the tauri desktop architecture
```
