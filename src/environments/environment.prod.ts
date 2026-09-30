/**
 * Production build-time defaults. See `environment.ts` for the full contract.
 *
 * Everything here is overridable at runtime by
 * `assets/config/runtime-config.js`, which is deliberately NOT baked into the
 * bundle: a deployment rewrites that one file to re-point the app at a
 * different API host without a rebuild.
 */
export const environment = {
  production: true,
  /** Empty = same-origin; requests are forwarded to the Node API by the web server. */
  apiBaseUrl: '',
  /** Empty = same-origin, correct for assets shipped inside the bundle. */
  assetsBaseUrl: '',
  /** Overwritten at runtime when the app is loaded inside the desktop shell. */
  platform: 'browser',
};
