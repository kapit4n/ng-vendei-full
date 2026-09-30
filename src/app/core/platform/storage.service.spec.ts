import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  let svc: StorageService;
  let store: Map<string, string>;
  let failWrites: boolean;
  let failReads: boolean;

  beforeEach(() => {
    store = new Map<string, string>();
    failWrites = false;
    failReads = false;

    // Faking `localStorage` itself (rather than spying on `Storage.prototype`)
    // keeps the failure modes — quota errors, blocked access — expressible.
    const fake = {
      getItem: (k: string) => {
        if (failReads) {
          throw new DOMException('blocked', 'SecurityError');
        }
        return store.has(k) ? store.get(k)! : null;
      },
      setItem: (k: string, v: string) => {
        if (failWrites) {
          throw new DOMException('quota', 'QuotaExceededError');
        }
        store.set(k, v);
      },
      removeItem: (k: string) => {
        if (failWrites) {
          throw new DOMException('blocked', 'SecurityError');
        }
        store.delete(k);
      },
    };
    spyOnProperty(window, 'localStorage', 'get').and.returnValue(fake as unknown as Storage);

    TestBed.configureTestingModule({});
    svc = TestBed.inject(StorageService);
  });

  it('reads through to the underlying value', () => {
    store.set('vendei.cart', '[]');
    expect(svc.get('cart')).toBe('[]');
  });

  it('returns null for a missing key rather than undefined', () => {
    expect(svc.get('missing')).toBeNull();
  });

  it('namespaces keys so features cannot collide', () => {
    expect(svc.set('cart', 'x')).toBe(true);
    expect(store.has('vendei.cart')).toBe(true);
  });

  it('parses JSON values', () => {
    store.set('vendei.cart', '{"id":1}');
    expect(svc.getJson<{ id: number }>('cart', { id: 0 })).toEqual({ id: 1 });
  });

  it('returns the fallback for a missing JSON value', () => {
    expect(svc.getJson('nothing', { id: 7 })).toEqual({ id: 7 });
  });

  it('returns the fallback for corrupt JSON instead of throwing', () => {
    store.set('vendei.cart', '{not json');
    expect(svc.getJson('cart', { id: 0 })).toEqual({ id: 0 });
  });

  it('removes a key through the namespace', () => {
    store.set('vendei.cart', '[]');
    expect(svc.remove('cart')).toBe(true);
    expect(store.has('vendei.cart')).toBe(false);
  });

  it('reports failure instead of crashing when writes are rejected', () => {
    failWrites = true;
    expect(svc.set('cart', 'x')).toBe(false);
  });

  it('warns once when writes fail, so a lost setting is not silent', () => {
    const warn = spyOn(console, 'warn');
    failWrites = true;

    svc.set('cart', 'x');
    svc.set('cart', 'y');

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('reports failure instead of crashing when storage is unavailable', () => {
    failReads = true;
    expect(svc.get('cart')).toBeNull();
  });

  it('does not throw on remove when storage is unavailable', () => {
    failReads = true;
    failWrites = true;
    expect(svc.remove('cart')).toBe(false);
  });

  it('exposes raw access for keys that must keep their legacy name', () => {
    expect(svc.setRaw('pos_cart', '[1]')).toBe(true);
    expect(store.has('pos_cart')).toBe(true);
    expect(svc.getRaw('pos_cart')).toBe('[1]');
  });

  it('keeps a raw key visible to a non-namespaced reader', () => {
    svc.setRaw('legacy', 'v');
    expect(svc.getRaw('legacy')).toBe('v');
    expect(svc.get('legacy')).toBeNull();
  });
});
