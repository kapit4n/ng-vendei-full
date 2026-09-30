import { Injectable } from '@angular/core';

/**
 * Namespaced, failure-tolerant access to `localStorage`.
 *
 * Wrapped because `localStorage` throws on access in some privacy modes and in
 * non-browser contexts, which would otherwise take the whole POS down. Reads
 * therefore fall back and writes report success instead of propagating.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
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
      return false;
    }
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
