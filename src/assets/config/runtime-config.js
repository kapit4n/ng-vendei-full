/**
 * Runtime configuration for Vendei Full.
 *
 * This file is loaded by `index.html` BEFORE the application bundle and is the
 * only supported way to change deployment settings without rebuilding the app.
 * Editing it (bind-mount, Docker entrypoint, Tauri resource dir) is enough.
 *
 * Server mode — leave `apiBaseUrl` empty so requests are same-origin:
 *     window.__VENDEI_CONFIG__ = { "apiBaseUrl": "", "platform": "browser" };
 *
 * Server mode — dedicated API host (add CORS on the API):
 *     window.__VENDEI_CONFIG__ = { "apiBaseUrl": "https://api.example.com" };
 *
 * Desktop mode — the shell bundles a local Node API and SQLite database:
 *     window.__VENDEI_CONFIG__ = { "apiBaseUrl": "http://127.0.0.1:3999", "platform": "desktop" };
 *
 * Never put database credentials here. This file is served to every client.
 */
window.__VENDEI_CONFIG__ = {
  apiBaseUrl: '',
  assetsBaseUrl: '',
  platform: 'browser',
};
