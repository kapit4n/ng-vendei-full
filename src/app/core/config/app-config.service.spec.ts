import { AppConfigService } from './app-config.service';
import { VendeiRuntimeConfig, resolveRuntimeConfig, normalizeBaseUrl } from './runtime-config';

describe('runtime-config', () => {
  it('falls back to build-time environment when nothing is injected', () => {
    const config = resolveRuntimeConfig({ apiBaseUrl: '/api/', assetsBaseUrl: '/assets/', platform: 'browser' }, {});

    expect(config.apiBaseUrl).toBe('/api');
    expect(config.platform).toBe('browser');
  });

  it('overrides build-time values with runtime values', () => {
    const config = resolveRuntimeConfig(
      { apiBaseUrl: 'https://api.example.com', assetsBaseUrl: '', platform: 'browser' },
      { apiBaseUrl: 'https://desktop.local:8080' }
    );

    expect(config.apiBaseUrl).toBe('https://desktop.local:8080');
  });

  it('drops a trailing slash so joins never produce a double slash', () => {
    expect(normalizeBaseUrl('https://api.example.com/')).toBe('https://api.example.com');
    expect(normalizeBaseUrl('https://api.example.com///')).toBe('https://api.example.com');
  });

  it('treats a root slash as an empty base so paths stay origin-relative', () => {
    expect(normalizeBaseUrl('/')).toBe('');
  });

  it('normalises runtime values instead of trusting them', () => {
    const config = resolveRuntimeConfig(
      { apiBaseUrl: '', assetsBaseUrl: '', platform: 'browser' },
      { apiBaseUrl: 'https://api.example.com/' }
    );

    expect(config.apiBaseUrl).toBe('https://api.example.com');
  });

  it('ignores blank runtime values so a partial file does not wipe config', () => {
    const config = resolveRuntimeConfig(
      { apiBaseUrl: 'https://api.example.com', assetsBaseUrl: '', platform: 'browser' },
      { apiBaseUrl: '   ' }
    );

    expect(config.apiBaseUrl).toBe('https://api.example.com');
  });
});

describe('AppConfigService', () => {
  afterEach(() => {
    delete (globalThis as { __VENDEI_CONFIG__?: unknown }).__VENDEI_CONFIG__;
  });

  it('exposes runtime config set on the global before construction', () => {
    (globalThis as { __VENDEI_CONFIG__?: VendeiRuntimeConfig }).__VENDEI_CONFIG__ = {
      apiBaseUrl: 'https://desktop.local:8080/',
      assetsBaseUrl: '',
      platform: 'desktop',
    };

    const svc = new AppConfigService();
    expect(svc.apiBaseUrl).toBe('https://desktop.local:8080');
    expect(svc.platform).toBe('desktop');
  });

  it('joins asset paths without duplicating slashes', () => {
    (globalThis as { __VENDEI_CONFIG__?: VendeiRuntimeConfig }).__VENDEI_CONFIG__ = {
      apiBaseUrl: '',
      assetsBaseUrl: 'https://cdn.example.com/',
      platform: 'browser',
    };

    const svc = new AppConfigService();
    expect(svc.assetUrl('assets/logo.png')).toBe('https://cdn.example.com/assets/logo.png');
  });

  it('serves assets from the app origin when no asset base is configured', () => {
    const svc = new AppConfigService();
    expect(svc.assetUrl('assets/vendei/print-logo.png')).toBe('/assets/vendei/print-logo.png');
  });

  it('makes an asset URL absolute so it resolves inside a generated receipt', () => {
    (globalThis as { __VENDEI_CONFIG__?: VendeiRuntimeConfig }).__VENDEI_CONFIG__ = {
      apiBaseUrl: '',
      assetsBaseUrl: '',
      platform: 'browser',
    };

    const svc = new AppConfigService();
    const url = svc.absoluteAssetUrl('assets/vendei/print-logo.png');
    expect(url).toMatch(/^https?:\/\/[^/]+\/assets\/vendei\/print-logo\.png$/);
  });

  it('never exposes a database credential field on the frontend config surface', () => {
    const svc = new AppConfigService();
    const surface = ['apiBaseUrl', 'assetsBaseUrl', 'platform'] as const;
    surface.forEach((key) => expect(svc[key]).toBeDefined());
    expect(Object.keys(svc)).not.toContain('database');
    expect(Object.keys(svc)).not.toContain('dbUrl');
  });
});
