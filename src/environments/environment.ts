// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --configuration production` replaces `environment.ts` with
// `environment.prod.ts`. The list of file replacements is in `angular.json`.
//
// These are BUILD-TIME defaults only. Deployments override them at runtime via
// `src/assets/config/runtime-config.js` (published as `window.__VENDEI_CONFIG__`),
// which is a plain file that can be swapped without rebuilding the bundle.
//
// Desktop: the Tauri shell points `apiBaseUrl` at the bundled local Node API.
// Server:  leave `apiBaseUrl` empty so requests are same-origin and nginx
//          forwards them to the Node API.
//
// No database credentials belong here — the database is only reachable by the
// backend process.

export const environment = {
  production: false,
  /** Dev: empty string = same origin as `ng serve`; `proxy.conf.json` forwards to the backend. */
  apiBaseUrl: '',
  /** App-owned static assets (logos, placeholders) served alongside the bundle. */
  assetsBaseUrl: '',
  /** Informational only; capability checks live in `PlatformService`. */
  platform: 'browser',
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
