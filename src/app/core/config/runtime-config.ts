/**
 * Deployment-agnostic runtime configuration.
 *
 * Values come from two layers, later layers winning:
 *
 *  1. Build-time defaults baked into the bundle (`src/environments/environment.ts`).
 *  2. A runtime override published as `window.__VENDEI_CONFIG__` by
 *     `src/assets/config/runtime-config.js`, which is a *plain file* that a
 *     deployment can rewrite without rebuilding the app (Docker entrypoint,
 *     nginx bind mount, Tauri resource directory).
 *
 * Desktop mode: the shell writes `__VENDEI_CONFIG__` pointing at the bundled
 * local API, e.g. `{ "apiBaseUrl": "http://127.0.0.1:3999" }`.
 * Server mode:  `apiBaseUrl` stays `""` so requests are same-origin and pass
 *               through nginx to the Node API.
 *
 * Nothing here ever contains a database credential — the database is reached
 * only by the backend process.
 */

export type PlatformKind = 'desktop' | 'browser';

export interface VendeiRuntimeConfig {
  /** Base URL of the Node API. `''` means same-origin. Never ends with `/`. */
  apiBaseUrl: string;
  /** Base URL for app-owned static assets. `''` means same-origin. Never ends with `/`. */
  assetsBaseUrl: string;
  /** Informational; capability checks belong to `PlatformService`. */
  platform: PlatformKind;
}

export type RuntimeConfigOverride = Partial<Record<keyof VendeiRuntimeConfig, unknown>>;

/** Strip a single trailing slash so callers can always concatenate `/path`. */
export function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '/') {
    return '';
  }
  return trimmed.replace(/\/+$/, '');
}

function normalizePlatform(value: unknown, fallback: PlatformKind): PlatformKind {
  return value === 'desktop' || value === 'browser' ? value : fallback;
}

/**
 * Pure merge of build-time and runtime layers. Unknown keys are ignored and
 * malformed values fall back to the build-time value, so a bad runtime file
 * degrades to the default instead of breaking the app.
 *
 * A blank runtime value counts as *absent* rather than empty: deployments often
 * template `runtime-config.js` with empty placeholders, and that must not wipe
 * a working build-time value.
 */
export function resolveRuntimeConfig(
  buildTime: RuntimeConfigOverride,
  runtime: RuntimeConfigOverride | null | undefined
): VendeiRuntimeConfig {
  const buildApi = normalizeBaseUrl(buildTime.apiBaseUrl);
  const buildAssets = normalizeBaseUrl(buildTime.assetsBaseUrl);
  return {
    apiBaseUrl: normalizeBaseUrl(runtime?.apiBaseUrl) || buildApi,
    assetsBaseUrl: normalizeBaseUrl(runtime?.assetsBaseUrl) || buildAssets,
    platform: normalizePlatform(runtime?.platform ?? buildTime.platform, 'browser'),
  };
}

/**
 * Read the runtime override from the global scope.
 *
 * Kept separate from `resolveRuntimeConfig` so the merge rules stay unit
 * testable without a browser.
 */
export function readRuntimeOverride(): RuntimeConfigOverride | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const injected = (window as unknown as Record<string, unknown>)['__VENDEI_CONFIG__'];
  return injected && typeof injected === 'object' ? (injected as RuntimeConfigOverride) : null;
}
