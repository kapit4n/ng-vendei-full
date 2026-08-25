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

export interface PosConfig {
  catalogColumns: number;
  showProductImages: boolean;
  quickProducts: number[];
  defaultSellingMode: string;
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

const STORAGE_KEY = 'activeStoreProfileId';

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
        const currentId = this.activeProfileId$.getValue();
        if (currentId === null && profiles.length > 0) {
          const def = profiles.find((p: StoreProfile) => p.defaultProfile) || profiles[0];
          this.setActiveProfile(def);
        } else if (currentId !== null && !profiles.find((p: StoreProfile) => p.id === currentId)) {
          const def = profiles.find((p: StoreProfile) => p.defaultProfile) || profiles[0];
          if (def) this.setActiveProfile(def);
        }
      }),
      catchError((err) => {
        console.error('[VStoreProfileService] getProfiles failed', err);
        return of([]);
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
