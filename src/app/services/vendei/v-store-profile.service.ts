import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { VConfigService } from './v-config.service';

export interface ReceiptConfig {
  paperWidth: number;
  logo?: string;
  headerLines: string[];
  footerLines: string[];
}

/** Stable lowercase identifiers for the POS product card density. */
export type ProductCardSize = 'small' | 'medium' | 'large';

export const PRODUCT_CARD_SIZES: ProductCardSize[] = ['small', 'medium', 'large'];

/** Coerce any input into a valid card size; unknown/invalid values fall back to medium. */
export function normalizeCatalogCardSize(value: unknown): ProductCardSize {
  return PRODUCT_CARD_SIZES.includes(value as ProductCardSize) ? (value as ProductCardSize) : 'medium';
}

export interface PosConfig {
  catalogColumns: number;
  showProductImages: boolean;
  quickProducts: number[];
  defaultSellingMode: SellingMode;
  enabledPaymentTypes: number[];
  /** When true, POS cards disable out-of-stock products. Optional; default true. */
  respectStock?: boolean;
  /**
   * Product card density for the POS grid (small | medium | large).
   * Presentation-only: never changes product/selling logic. Optional; default medium.
   */
  catalogCardSize?: ProductCardSize;
}

export interface StoreProfile {
  id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  defaultProfile: boolean;

  // Business identity (Phase 1 — MB-004)
  businessType?: string;
  businessName?: string;

  // Localization
  currency?: string;
  currencySymbol?: string;
  locale?: string;

  // Legal/tax
  taxId?: string;
  taxLabel?: string;
  address?: string;

  // Capabilities
  capabilities?: string[];

  // Configuration
  receiptConfig?: ReceiptConfig;
  posConfig?: PosConfig;
}

/** Default capabilities assigned to new profiles. */
const DEFAULT_CAPABILITIES: string[] = [
  'BARCODE',
  'DISCOUNTS',
  'CUSTOMERS',
];

/** Default receipt configuration. */
const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  paperWidth: 80,
  headerLines: [],
  footerLines: [],
};

/** Default POS configuration. */
const DEFAULT_POS_CONFIG: PosConfig = {
  catalogColumns: 4,
  showProductImages: true,
  quickProducts: [],
  defaultSellingMode: 'UNIT',
  enabledPaymentTypes: [1, 4],
  respectStock: true,
  catalogCardSize: 'medium',
};

/** Well-known capability constants. */
export const CAPABILITIES = {
  BARCODE: 'BARCODE',
  WEIGHT_PRODUCTS: 'WEIGHT_PRODUCTS',
  VARIABLE_QUANTITY: 'VARIABLE_QUANTITY',
  LOT_TRACKING: 'LOT_TRACKING',
  EXPIRATION: 'EXPIRATION',
  PRODUCT_VARIANTS: 'PRODUCT_VARIANTS',
  COMBOS: 'COMBOS',
  DISCOUNTS: 'DISCOUNTS',
  CUSTOMERS: 'CUSTOMERS',
  SERIAL_NUMBERS: 'SERIAL_NUMBERS',
  TAX_CALCULATION: 'TAX_CALCULATION',
  LOYALTY: 'LOYALTY',
} as const;

export type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES];

/** Well-known selling mode constants. */
export const SELLING_MODES = {
  UNIT: 'UNIT',
  WEIGHT: 'WEIGHT',
  VARIABLE_QTY: 'VARIABLE_QTY',
  VARIANT: 'VARIANT',
  COMBO: 'COMBO',
} as const;

export type SellingMode = typeof SELLING_MODES[keyof typeof SELLING_MODES];

/** Whether the selling mode uses decimal quantities (weight, meters, etc.). */
export function isDecimalSellingMode(mode: string | undefined | null): boolean {
  return mode === SELLING_MODES.WEIGHT || mode === SELLING_MODES.VARIABLE_QTY;
}

/** Default unit label for a selling mode. */
export function sellingModeUnitLabel(mode: string | undefined | null): string {
  switch (mode) {
    case SELLING_MODES.WEIGHT: return 'kg';
    case SELLING_MODES.VARIABLE_QTY: return 'm';
    case SELLING_MODES.UNIT: return 'un';
    default: return '';
  }
}

const STORAGE_KEY = 'activeStoreProfileId';

/**
 * Deterministically resolve which profile the POS should use at startup.
 * Single source of truth for default/business selection so POS pages and
 * settings screens never diverge:
 *   1. an existing stored (temporary) selection wins;
 *   2. otherwise the configured default business if it exists and is active;
 *   3. otherwise the first available active profile;
 *   4. otherwise the first profile;
 *   5. otherwise null (no profiles).
 * Prefers active profiles so an admin-deactivated default never wedges POS startup.
 */
export function resolveInitialProfileId(
  profiles: StoreProfile[],
  storedId: number | null
): number | null {
  if (storedId !== null && profiles.some((p) => p.id === storedId)) return storedId;
  const isActive = (p: StoreProfile) => p.active;
  const configuredDefault = profiles.find((p) => p.defaultProfile && isActive(p));
  if (configuredDefault) return configuredDefault.id;
  const firstActive = profiles.find(isActive);
  if (firstActive) return firstActive.id;
  return profiles.length > 0 ? profiles[0].id : null;
}

/**
 * Whether the resolved profile differs from the previously stored selection,
 * meaning a fallback occurred and should be reported. A valid stored (manual)
 * selection is a deliberate choice and never a fallback, even when it differs
 * from the configured default.
 */
export function mapFallbackReason(
  profiles: StoreProfile[],
  storedId: number | null,
  resolvedId: number | null
): string | null {
  if (resolvedId === null) return null;
  if (storedId !== null) {
    if (storedId === resolvedId) return null;
    return `stored profile id ${storedId} no longer exists; fell back to profile ${resolvedId}`;
  }
  const configuredDefault = profiles.find((p) => p.defaultProfile);
  if (configuredDefault && resolvedId !== configuredDefault.id) {
    return `configured default profile ${configuredDefault.id} is unavailable; fell back to profile ${resolvedId}`;
  }
  return null;
}

@Injectable({
  providedIn: 'root',
})
export class VStoreProfileService {
  private profiles: StoreProfile[] = [];
  private activeProfileId$ = new BehaviorSubject<number | null>(this.loadFromStorage());

  constructor(private http: HttpClient, private configSvc: VConfigService) {}

  getProfiles(): Observable<StoreProfile[]> {
    return this.http.get<any>(`${this.configSvc.baseUrl}/storeProfiles`).pipe(
      map((body) => {
        if (Array.isArray(body)) return body;
        if (body && typeof body === 'object') {
          const nested = (body as any)['data'] ?? (body as any)['rows'] ?? (body as any)['items'];
          if (Array.isArray(nested)) return nested;
        }
        return [];
      }),
      tap((profiles) => {
        this.profiles = profiles;
        const storedId = this.activeProfileId$.getValue();
        const resolvedId = resolveInitialProfileId(profiles, storedId);
        if (resolvedId !== null && resolvedId !== storedId) {
          const reason = mapFallbackReason(profiles, storedId, resolvedId);
          if (reason) console.warn(`[VStoreProfileService] ${reason}`);
          this.setActiveProfile(profiles.find((p: StoreProfile) => p.id === resolvedId)!);
        }
      }),
      catchError((err) => {
        console.error('[VStoreProfileService] getProfiles failed', err);
        return of([]);
      })
    );
  }

  /** The configured default business/catalog profile from the given list (or cache). */
  getDefaultProfile(profiles?: StoreProfile[]): StoreProfile | null {
    const list = profiles ?? this.profiles;
    return list.find((p) => p.defaultProfile) || null;
  }

  /**
   * Persist the default business type (catalog the POS opens with) for this
   * application. Persisted via the backend so it survives reload and login.
   * The current POS session is intentionally untouched: only startup uses it.
   */
  setDefaultProfile(profile: StoreProfile): Observable<StoreProfile> {
    return this.http.put<any>(`${this.configSvc.baseUrl}/storeProfiles/${profile.id}/default`, null).pipe(
      map((body) => {
        const data: StoreProfile | undefined =
          (body && typeof body === 'object' && (body.data ?? body.profile)) ?? body;
        return data as StoreProfile;
      }),
      tap((updated) => {
        if (!updated || typeof updated.id !== 'number') return;
        this.profiles = this.profiles.map((p) => ({
          ...p,
          defaultProfile: p.id === updated.id,
        }));
      })
    );
  }

  getActiveProfileId(): number | null {
    return this.activeProfileId$.getValue();
  }

  getActiveProfileId$(): Observable<number | null> {
    return this.activeProfileId$.asObservable();
  }

  getActiveProfile(): StoreProfile | null {
    const id = this.activeProfileId$.getValue();
    if (id === null) return null;
    return this.profiles.find((p) => p.id === id) || null;
  }

  setActiveProfile(profile: StoreProfile): void {
    localStorage.setItem(STORAGE_KEY, String(profile.id));
    this.activeProfileId$.next(profile.id);
  }

  // ── Business configuration helpers ──────────────────────────────────

  /** All loaded profiles. */
  getProfilesSnapshot(): StoreProfile[] {
    return this.profiles;
  }

  /** Currency code (default: 'BOB'). */
  getCurrency(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.currency || 'BOB';
  }

  /** Currency symbol (default: 'Bs'). */
  getCurrencySymbol(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.currencySymbol || 'Bs';
  }

  /** Locale string (default: 'es-BO'). */
  getLocale(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.locale || 'es-BO';
  }

  /** Tax label (default: 'NIT'). */
  getTaxLabel(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.taxLabel || 'NIT';
  }

  /** Tax ID value (default: empty). */
  getTaxId(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.taxId || '';
  }

  /** Business address for receipts. */
  getAddress(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.address || '';
  }

  /** Business name for invoices/receipts. */
  getBusinessName(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.businessName || p?.name || '';
  }

  /** Business type slug. */
  getBusinessType(profile?: StoreProfile | null): string {
    const p = profile ?? this.getActiveProfile();
    return p?.businessType || p?.slug || '';
  }

  /** Capabilities array (default: basic set). */
  getCapabilities(profile?: StoreProfile | null): string[] {
    const p = profile ?? this.getActiveProfile();
    return p?.capabilities || DEFAULT_CAPABILITIES;
  }

  /** Check if a specific capability is enabled. */
  hasCapability(capability: string, profile?: StoreProfile | null): boolean {
    const p = profile ?? this.getActiveProfile();
    return this.getCapabilities(p).includes(capability);
  }

  /** Receipt configuration (with defaults). */
  getReceiptConfig(profile?: StoreProfile | null): ReceiptConfig {
    const p = profile ?? this.getActiveProfile();
    return { ...DEFAULT_RECEIPT_CONFIG, ...p?.receiptConfig };
  }

  /** POS configuration (with defaults). */
  getPosConfig(profile?: StoreProfile | null): PosConfig {
    const p = profile ?? this.getActiveProfile();
    return { ...DEFAULT_POS_CONFIG, ...p?.posConfig };
  }

  /**
   * Product card density used by the POS product grid (default: medium).
   * Returns a valid size for any stored value, falling back to medium.
   */
  getCatalogCardSize(profile?: StoreProfile | null): ProductCardSize {
    const config = this.getPosConfig(profile);
    return normalizeCatalogCardSize(config.catalogCardSize);
  }

  /**
   * Persist the POS product card size for a profile (default: active profile).
   * Presentation-only change: the shared config is updated in the local cache so
   * the running POS session is never reloaded, reset, or re-fetched; the active
   * business, search, ticket, categories and payments are all preserved.
   */
  setCatalogCardSize(
    size: ProductCardSize,
    profile?: StoreProfile | null
  ): Observable<StoreProfile | null> {
    const target = profile ?? this.getActiveProfile();
    if (!target) return of(null);
    const normalized = normalizeCatalogCardSize(size);
    const posConfig = { ...this.getPosConfig(target), catalogCardSize: normalized };
    return this.http
      .put<any>(`${this.configSvc.baseUrl}/storeProfiles/${target.id}`, {
        name: target.name,
        slug: target.slug,
        posConfig,
      })
      .pipe(
        map((body) => {
          const data: StoreProfile | undefined =
            (body && typeof body === 'object' && (body.data ?? body.profile)) ?? body;
          return (data ?? null) as StoreProfile | null;
        }),
        tap((updated) => {
          if (!updated || typeof updated.id !== 'number') return;
          this.profiles = this.profiles.map((p) =>
            p.id === updated.id
              ? { ...p, posConfig: { ...(p.posConfig as PosConfig), catalogCardSize: normalized } }
              : p
          );
        })
      );
  }

  /** Default selling mode from POS config (default: UNIT). */
  getDefaultSellingMode(profile?: StoreProfile | null): SellingMode {
    const config = this.getPosConfig(profile);
    return (config.defaultSellingMode as SellingMode) || SELLING_MODES.UNIT;
  }

  /** Resolve the effective selling mode: product override → profile default → UNIT. */
  resolveSellingMode(productSellingMode?: string | null, profile?: StoreProfile | null): SellingMode {
    if (productSellingMode && Object.values(SELLING_MODES).includes(productSellingMode as SellingMode)) {
      return productSellingMode as SellingMode;
    }
    return this.getDefaultSellingMode(profile);
  }

  /** Enabled payment type IDs for the active profile (default: [1, 4] = Cash + QR). */
  getEnabledPaymentTypes(profile?: StoreProfile | null): number[] {
    const config = this.getPosConfig(profile);
    return config.enabledPaymentTypes?.length ? config.enabledPaymentTypes : [1, 4];
  }

  private loadFromStorage(): number | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }
}
