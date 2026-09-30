# Target architecture

Where this codebase is going, and what is deliberately still out of scope.

The goal: **one Angular application that runs unchanged in a browser behind
nginx, and inside a Tauri shell**, with no build-time knowledge of which one it
is in. The backend keeps serving plain HTTP and the frontend keeps talking to it
over plain HTTP.

The Tauri shell now exists and runs in development (`npm run tauri:dev`).
Distribution — bundling Node so a user needs nothing installed — is the next
milestone; see [tauri-progress.md](tauri-progress.md).

## Rules that hold the design together

1. **No deployment knowledge in components.** A component must not know whether
   the API is on `localhost:3000`, on the same origin behind nginx, or on a
   Tethering-style local server. It asks `AppConfigService`.
2. **No credentials in the frontend.** API URLs are not secrets. Tokens, if any
   are added later, belong in a session, not in `runtime-config.js`.
3. **Runtime config is deployment-owned.** A container can rewrite one JS file
   without rebuilding the bundle.
4. **Platform differences go through one seam.** `PlatformService` is the only
   place that knows a Tauri global exists.
5. **Failure-tolerant storage.** `localStorage` throwing must never take the
   POS down mid-sale.

## Configuration

Two sources, merged at bootstrap by `resolveRuntimeConfig()`:

- **Build-time** — `src/environments/environment.{ts,prod.ts}`. Baked into the
  bundle; good defaults for local development.
- **Runtime** — `window.__VENDEI_CONFIG__`, set by
  `src/assets/config/runtime-config.js`. Overrides the build-time values at
  page load.

Merge rules that are load-bearing:

- A blank or whitespace-only runtime value **falls back** to the build-time
  value rather than becoming `""`. This is deliberate: a hand-edited
  `runtime-config.js` with `apiBaseUrl: ''` must not silently point the app at
  itself and produce confusing 404s. There is a test for it.
- Trailing slashes are normalized away, so `http://host:3000/` and
  `http://host:3000` behave identically.
- The root path `/` normalizes to `""`, which the request builder treats as
  "same origin" and leaves as a relative path.

`AppConfigService.assetUrl()` resolves asset paths; `absoluteAssetUrl()` is for
the cases that need a real absolute URL (notably receipt-logo printing, where
the popup has no meaningful base). Nothing constructs `http://localhost` by
hand any more.

## HTTP boundary

`core/api/` is the only place that builds a request URL.

- `API_PATHS` — every collection and action path in the app, named once. The
  nginx and dev-proxy configs were both updated to match; they used to cover a
  subset, which is why bare collection requests 404'd behind the reverse proxy
  while the same calls worked in dev.
- `ApiClientService` — `get`/`post`/`put`/`patch`/`delete`, query
  serialization, and the base URL join. It rejects an absolute or
  protocol-relative `path`, so a caller cannot smuggle a different host through
  what looks like a relative path.

Feature services under `app/services/**` call this instead of `HttpClient`
with hand-built URLs.

## Platform seam

`core/platform/`:

| Service           | Responsibility                                                  |
| ----------------- | --------------------------------------------------------------- |
| `PlatformService` | Browser vs desktop, via the presence of the Tauri global        |
| `StorageService`  | Namespaced `localStorage`, never throws                         |
| `PrintService`    | Opens a print window and exposes `closed$` so callers can react |

`PrintService` returns a handle rather than fire-and-forget, which is what let
the POS flow print-and-continue without guessing when the popup closed.

`StorageService` warns once when a write fails, with platform-specific wording:
in a desktop webview storage is owned by the shell and may be ephemeral, while
in a browser a failed write is quota or private mode. A write that returns
`false` and says nothing is the worst outcome — the POS keeps working and the
setting is silently lost.

## Deployment shapes

### Browser, nginx

`nginx.conf` serves the SPA, falls back to `index.html` for client routes,
caches hashed assets hard, and — critically — serves `runtime-config.js` with
`no-store` so a rewritten config is never served from cache.

The `location` regex covers the bare collection names (`/products`,
`/categories`, …) as well as `/api`, because those are the paths the app
actually issues.

### Tauri

**Implemented.** The bundle is the same one nginx serves. The shell lives in
`src-tauri/` and does two things: it owns the lifecycle of the local Node API,
and it points the app at it.

The window is built from the `tauri.conf.json` entry, with `visible: false`
until the API answers, so the POS never paints a first frame full of failed
requests.

The API base URL and `platform: 'desktop'` reach the page through the existing
runtime-config channel — `window.__VENDEI_CONFIG__` is *assigned* wholesale by
`runtime-config.js` before the bundle loads, so the shell re-applies its values
both before page scripts (`initialization_script`) and after them
(`on_page_load`). See [tauri-progress.md](tauri-progress.md) for why one of the
two is not enough.

Startup, shutdown and the `PR_SET_PDEATHSIG` backstop are documented there. The
short version: readiness is a real `GET /api/health` probe, never a sleep, and
closing the window stops the API rather than leaking it onto its port.

Still not implemented, by instruction: installers, auto-update, a bundled Node
runtime, and the first-launch workflow.

## POS use case

`PosSaleService` owns the order write. The sequence is unchanged:

1. Save the order.
2. Save its details.
3. Decrement inventory and recompute totals.

**This is not atomic.** It was not atomic before the refactor either, and
changing that is a backend concern (a transaction spanning
`orders`/`orderDetails`/`inventory`), not something the frontend can fix. The
extraction exists to give that sequence one owner and one seam, so a
transaction can be introduced behind it without touching the component again.

`orderChangeDue()` in `utils/money.ts` centralises the change rule, including
the sign convention for underpayment.

## Testing strategy

The unit suite has ~758 specs in one Karma run, and that run intermittently
disconnects part-way through — independent of any change under test. Scoped
runs are therefore the primary signal, via `scripts/test-scoped.mjs`, which
builds a temporary entry point matching only the specs you name:

```
node scripts/test-scoped.mjs app/core
node scripts/test-scoped.mjs spec:pos-sale.service
```

The generated entry point is removed and `tsconfig.spec.json` restored on exit,
including on failure. Note that an *interrupted* run (killed, not failed) does
not reach the restore, so a dirty `tsconfig.spec.json` means a scoped run was
killed; `git checkout -- src/tsconfig.spec.json` recovers it. Keep scopes small
enough to finish — `app/pages` as a single 223-spec scope is large enough to hit
the disconnect, while its sub-scopes are green.

The Tauri shell is covered separately by `scripts/verify-tauri.sh`, because
Playwright cannot see a native window. See
[tauri-progress.md](tauri-progress.md).

`test:setup.ts` holds the Jasmine bootstrap so the generated entry point stays
small, and is excluded from the app build.

## Starting it locally

Four explicit entry points, because "which mode am I in" is the one question
that changes behaviour and it used to be invisible:

```bash
npm run start:web         # browser; API same-origin via proxy.conf.json
npm run start:web:prod    # production build, served with nginx's rules replicated
npm run start:desktop     # browser simulation; platform=desktop; API on :3999
npm run tauri:dev         # the real thing; native window; owns the API lifecycle
```

`start:web`, `start:web:prod` and `start:desktop` each rewrite
`src/assets/config/runtime-config.js` on start and restore it on exit, so the
tracked file is never left dirty. Each refuses to run if that file has
uncommitted local edits.

`tauri:dev` does not rewrite it at all: the shell injects the configuration into
the page, so it has nothing to restore and cannot leave the repo dirty.

`run-desktop.sh` deliberately passes `--proxy-config /dev/null`. A desktop-mode
run that quietly resolved same-origin requests through the dev proxy would look
healthy while the absolute-URL path — the one a real shell depends on — was
broken. It also fails fast if the backend does not enable CORS. `run-tauri.sh`
keeps both guards.

`start:desktop` is not superseded by `tauri:dev`. It stays because it needs no
Rust toolchain and is what the Playwright suite drives, against the identical
bundle and the identical desktop configuration.

Ports can be overridden: `WEB_BACKEND_PORT`, `WEB_FRONTEND_PORT`,
`DESKTOP_API_PORT`, `DESKTOP_FRONTEND_PORT`, `TAURI_API_PORT`. The desktop
frontend defaults to 4201 so it can run alongside the web one; the Tauri Angular
dev server is fixed at 4300 to match `devUrl`.

## Out of scope

Recording these so the next person does not assume they were forgotten.

### Backend (`../inventory-nod`, separate repository)

- **Layering.** Controllers talk directly to Sequelize models. The POS sale
  sequence above needs a service layer to become transactional.
- **Real migrations.** Schema is currently synced from models.
- **SQLite specifically.** Transactions and concurrency under SQLite are
  different from the Postgres-shaped code one might assume. `ARCHITECTURE.md`
  claims PostgreSQL; it is wrong, and should be corrected when that repo is
  next touched.
- **No test script.** `npm test` does not exist there.

None of this blocks the frontend refactor; all of it is required before the
backend can support a desktop client that owns its own data.

### Desktop packaging

The shell exists and runs (`npm run tauri:dev`), but nothing is distributable
yet:

- **No bundled Node.** `tauri:dev` needs a Rust toolchain and Node on the
  machine, and `src-tauri/src/main.rs` reads the backend location from
  `VENDEI_BACKEND_DIR` in the environment. A packaged build must resolve it from
  `app.path().resource_dir()` instead, so a user needs no Node installed.
- **No installer, no signing, no auto-update.**
- **No first-launch workflow** — schema preparation and seed/reset on first run.
- **`PR_SET_PDEATHSIG` is Linux-only**, so the abnormal-exit guarantee is
  weaker on macOS and Windows. Validated on Linux.
- **CORS on the API is `*`**; a real bundled API should be locked to the shell's
  origin.

`../vendei-desktop` (PySide6/Python, its own SQLite and SQLAlchemy layer) is a
separate codebase and remains unconverted. This Tauri shell is new code, not a
port of it.

## Summary

| Concern           | Frontend status         | Where                                 |
| ----------------- | ----------------------- | ------------------------------------- |
| Runtime config    | Done                    | `core/config`                         |
| HTTP boundary     | Done                    | `core/api`                            |
| Platform seam     | Done                    | `core/platform`                       |
| Deployment config | Done                    | `nginx.conf`, `playwright.config.ts`  |
| POS use case      | Done (still non-atomic) | `services/vendei/pos-sale.service.ts` |
| Unit tests        | Green when scoped       | `scripts/test-scoped.mjs`             |
| E2E tests         | Green, 20/20            | `playwright.config.ts`                |
| Tauri shell       | Done (dev only)         | `src-tauri/`                          |
| API lifecycle     | Done (health-gated)     | `src-tauri/src/main.rs`               |
| Backend layering  | Documented only         | `../inventory-nod`                    |
| Desktop packaging | Next milestone          | —                                     |
