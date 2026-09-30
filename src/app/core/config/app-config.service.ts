import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { PlatformKind, readRuntimeOverride, resolveRuntimeConfig, VendeiRuntimeConfig } from './runtime-config';

/** Ensure a path starts with exactly one `/`. */
function absolutePath(path: string): string {
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * The single source of truth for deployment configuration.
 *
 * Replaces the four duplicated `*-config.service.ts` classes that each read
 * `environment.apiBaseUrl` independently. Resolved once per application and
 * read-only from then on.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly config: VendeiRuntimeConfig;

  constructor() {
    this.config = resolveRuntimeConfig(
      {
        apiBaseUrl: environment.apiBaseUrl,
        assetsBaseUrl: environment.assetsBaseUrl,
        platform: environment.platform,
      },
      readRuntimeOverride()
    );
  }

  /** Base URL of the Node API. `''` means same-origin. */
  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  /** Base URL for app-owned static assets (logos, images baked into generated HTML). */
  get assetsBaseUrl(): string {
    return this.config.assetsBaseUrl;
  }

  get platform(): PlatformKind {
    return this.config.platform;
  }

  /** Resolve a URL against the API base. */
  apiUrl(path: string): string {
    return `${this.apiBaseUrl}${absolutePath(path)}`;
  }

  /** Resolve a URL against the asset base. Used for files shipped inside the app bundle. */
  assetUrl(path: string): string {
    return `${this.assetsBaseUrl}${absolutePath(path)}`;
  }

  /**
   * Absolute URL for an asset embedded into generated HTML (receipts, printable
   * tickets). Relative URLs cannot resolve inside a `window.open('', …)`
   * document, which is why this differs from `assetUrl`.
   *
   * Falls back to the relative path when no origin can be determined.
   */
  absoluteAssetUrl(path: string): string {
    const relative = this.assetUrl(path);
    if (ABSOLUTE_URL.test(relative)) {
      return relative;
    }
    const origin = currentOrigin();
    return origin ? `${origin}${relative}` : relative;
  }
}

const ABSOLUTE_URL = /^https?:\/\//i;

function currentOrigin(): string {
  const location = (globalThis as { location?: { origin?: string } }).location;
  const origin = location?.origin;
  // An opaque origin ("null") cannot address an asset.
  return origin && origin !== 'null' ? origin : '';
}
