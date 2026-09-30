import { Injectable, inject } from '@angular/core';

import { PlatformService } from './platform.service';

/**
 * Namespaced, failure-tolerant access to `localStorage`.
 *
 * Wrapped because `localStorage` throws on access in some privacy modes and in
 * non-browser contexts, which would otherwise take the whole POS down. Reads
 * therefore fall back and writes report success instead of propagating.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platform = inject(PlatformService);
  private warnedAboutWrites = false;

  private readonly prefix = 'vendei.';

  get(key: string): string | null {
    return this.read(this.prefix + key);
  }

  /** Returns whether the value was actually persisted. */
  set(key: string, value: string): boolean {
    return this.write(this.prefix + key, value);
  }

  remove(key: string): boolean {
    return this.removeKey(this.prefix + key);
  }

  /** Parse a stored JSON value, falling back when it is missing or corrupt. */
  getJson<T>(key: string, fallback: T): T {
    const raw = this.read(this.prefix + key);
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  /** Read without the namespace prefix, for migrating legacy keys. */
  getRaw(key: string): string | null {
    return this.read(key);
  }

  setRaw(key: string, value: string): boolean {
    return this.write(key, value);
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      this.warnOnceAboutWrites();
      return false;
    }
  }

  /**
   * A write that reports failure but says nothing is the worst outcome: the POS
   * keeps working and the setting is silently lost. The message differs by
   * platform because the causes do — a desktop webview's storage is owned by the
   * shell and may simply be ephemeral, whereas in a browser this is a quota or
   * private-mode problem the user can act on.
   */
  private warnOnceAboutWrites(): void {
    if (this.warnedAboutWrites) {
      return;
    }
    this.warnedAboutWrites = true;
    const hint = this.platform.isDesktop()
      ? 'the desktop shell owns persistence — verify storage is writable in the shell'
      : 'storage may be full or blocked (private mode?)';
    console.warn(`[StorageService] localStorage write failed; ${hint}`);
  }

  private removeKey(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}
