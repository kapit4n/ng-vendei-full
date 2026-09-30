# Target architecture

Where this codebase is going, and what is deliberately still out of scope.

The goal: **one Angular application that runs unchanged in a browser behind
nginx, and later inside a Tauri shell**, with no build-time knowledge of which
one it is in. The backend keeps serving plain HTTP and the frontend keeps
talking to it over plain HTTP.

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

### Tauri (later)

The bundle is the same. The shell provides `window.__TAURI__`, and
`PlatformService` reports `desktop`. The shell also needs a way to point the
app at a backend: write `runtime-config.js` before load, or set
`window.__VENDEI_CONFIG__` on the page.

Not implemented, by instruction — see "Out of scope".

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

The unit suite has ~750 specs in one Karma run, and that run intermittently
disconnects part-way through — independent of any change under test. Scoped
runs are therefore the primary signal, via `scripts/test-scoped.mjs`, which
builds a temporary entry point matching only the specs you name:

```
node scripts/test-scoped.mjs app/core
node scripts/test-scoped.mjs spec:pos-sale.service
```

The generated entry point is removed and `tsconfig.spec.json` restored on exit,
including on failure.

`test:setup.ts` holds the Jasmine bootstrap so the generated entry point stays
small, and is excluded from the app build.

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

### Desktop (`../vendei-desktop`, PySide6/Python)

It is a Python/PySide6 app with its own SQLite and SQLAlchemy layer, not a
Tauri shell. Converting it means:

- Choosing Tauri and rewriting the shell in Rust.
- Deciding whether the Python logic moves into the shell as commands, is
  reimplemented in TypeScript against the existing API, or is dropped once the
  frontend covers its features.

The frontend work above is the prerequisite for the second option, which is the
cheapest path.

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
| Backend layering  | Documented only         | `../inventory-nod`                    |
| Desktop/Tauri     | Documented only         | `../vendei-desktop`                   |
