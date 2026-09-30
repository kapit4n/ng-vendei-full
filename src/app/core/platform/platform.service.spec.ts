import { TestBed } from '@angular/core/testing';

import { PlatformService } from './platform.service';
import { VendeiRuntimeConfig } from '../config/runtime-config';

type TauriScope = { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown };

describe('PlatformService', () => {
  function build(tauri: TauriScope, configured: 'desktop' | 'browser'): PlatformService {
    // PlatformService resolves the deployment's configured platform through
    // AppConfigService, so the global must be seeded before injection.
    Object.assign(globalThis, tauri);
    (globalThis as { __VENDEI_CONFIG__?: VendeiRuntimeConfig }).__VENDEI_CONFIG__ = {
      apiBaseUrl: '',
      assetsBaseUrl: '',
      platform: configured,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(PlatformService);
  }

  afterEach(() => {
    const scope = globalThis as unknown as TauriScope;
    delete scope.__TAURI__;
    delete scope.__TAURI_INTERNALS__;
    delete (globalThis as { __VENDEI_CONFIG__?: unknown }).__VENDEI_CONFIG__;
  });

  it('reports browser mode by default', () => {
    const svc = build({}, 'browser');
    expect(svc.current).toBe('browser');
    expect(svc.isBrowser()).toBe(true);
    expect(svc.isDesktop()).toBe(false);
  });

  it('detects a Tauri v1 webview', () => {
    expect(build({ __TAURI__: {} }, 'browser').isDesktop()).toBe(true);
  });

  it('detects a Tauri v2 webview', () => {
    expect(build({ __TAURI_INTERNALS__: {} }, 'browser').isDesktop()).toBe(true);
  });

  it('lets a deployment force desktop mode without a Tauri global', () => {
    expect(build({}, 'desktop').isDesktop()).toBe(true);
  });

  it('keeps browser as the safe default for an unknown platform value', () => {
    (globalThis as { __VENDEI_CONFIG__?: unknown }).__VENDEI_CONFIG__ = {
      apiBaseUrl: '',
      assetsBaseUrl: '',
      platform: 'somethingElse',
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(PlatformService).isBrowser()).toBe(true);
  });
});
