import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { AppConfigService } from '../config/app-config.service';

export type PlatformKind = 'desktop' | 'browser';

/**
 * Isolates every "am I running inside a desktop shell?" decision.
 *
 * This is the **only** file in the app that knows Tauri exists. Feature code
 * asks `PlatformService` instead of sniffing globals, so a server deployment
 * can never accidentally depend on desktop-only behaviour.
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly config = inject(AppConfigService);
  private readonly doc = inject(DOCUMENT);
  private readonly kind: PlatformKind = detectPlatform(this.doc, this.config.platform);

  get current(): PlatformKind {
    return this.kind;
  }

  isDesktop(): boolean {
    return this.kind === 'desktop';
  }

  isBrowser(): boolean {
    return this.kind === 'browser';
  }
}

/**
 * A Tauri webview injects `__TAURI__` (v1) or `__TAURI_INTERNALS__` (v2) into
 * the global scope before any application script runs. Anything else counts as
 * a browser, which is the safe default: browser mode must work everywhere.
 */
function detectPlatform(doc: Document, configured: PlatformKind): PlatformKind {
  const scope = doc?.defaultView as unknown as Record<string, unknown> | null | undefined;
  if (scope && (scope['__TAURI__'] || scope['__TAURI_INTERNALS__'])) {
    return 'desktop';
  }
  return configured === 'desktop' ? 'desktop' : 'browser';
}
