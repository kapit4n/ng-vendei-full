export const environment = {
  production: true,
  /**
   * API base URL.  In production, override at runtime by defining
   * `window.__env = { apiBaseUrl: 'https://api.example.com' }`
   * BEFORE the Angular app bundle loads (e.g. via a <script> in index.html).
   * Falls back to same-origin when unset.
   */
  apiBaseUrl: (window as any).__env?.apiBaseUrl ?? '',
};
