import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VStoreProfileService, StoreProfile, CAPABILITIES } from './v-store-profile.service';
import { VConfigService } from './v-config.service';

describe('VStoreProfileService', () => {
  let service: VStoreProfileService;
  let httpMock: HttpTestingController;
  let configSvc: VConfigService;

  const mockProfiles: StoreProfile[] = [
    {
      id: 1, name: 'Supermarket', slug: 'supermarket', description: 'Groceries',
      active: true, defaultProfile: true,
      businessType: 'supermarket', businessName: 'Super Martinez',
      currency: 'BOB', currencySymbol: 'Bs', locale: 'es-BO',
      taxId: '1234567', taxLabel: 'NIT', address: 'Cochabamba, Bolivia',
      capabilities: ['BARCODE', 'WEIGHT_PRODUCTS', 'DISCOUNTS', 'CUSTOMERS', 'LOT_TRACKING', 'EXPIRATION'],
      receiptConfig: { paperWidth: 80, logo: 'logo.png', headerLines: ['Welcome'], footerLines: ['Thank you'] },
      posConfig: { catalogColumns: 5, showProductImages: true, quickProducts: [1, 2], defaultSellingMode: 'UNIT' },
    },
    {
      id: 2, name: 'Chicken Store', slug: 'chicken-store', description: 'Chicken',
      active: true, defaultProfile: false,
      businessType: 'chicken', businessName: 'Polleria El Pollo',
      currency: 'BOB', currencySymbol: 'Bs', locale: 'es-BO',
      capabilities: ['BARCODE', 'COMBOS', 'DISCOUNTS', 'CUSTOMERS'],
    },
    {
      id: 3, name: 'Legacy Store', slug: 'legacy', description: 'Old store',
      active: true, defaultProfile: false,
      // No new fields — tests backward compatibility
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VStoreProfileService, VConfigService],
    });
    service = TestBed.inject(VStoreProfileService);
    httpMock = TestBed.inject(HttpTestingController);
    configSvc = TestBed.inject(VConfigService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfiles', () => {
    it('fetches profiles from API', () => {
      service.getProfiles().subscribe((profiles) => {
        expect(profiles.length).toBe(3);
        expect(profiles[0].name).toBe('Supermarket');
      });
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);
    });

    it('normalizes nested response', () => {
      service.getProfiles().subscribe((profiles) => {
        expect(profiles.length).toBe(3);
      });
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush({ data: mockProfiles });
    });

    it('returns empty array on error', () => {
      service.getProfiles().subscribe((profiles) => {
        expect(profiles.length).toBe(0);
      });
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('active profile', () => {
    it('starts with null when nothing stored', () => {
      expect(service.getActiveProfileId()).toBeNull();
    });

    it('sets and gets active profile', () => {
      service.setActiveProfile(mockProfiles[0]);
      expect(service.getActiveProfileId()).toBe(1);
      expect(localStorage.getItem('activeStoreProfileId')).toBe('1');
    });

    it('persists to localStorage', () => {
      service.setActiveProfile(mockProfiles[1]);
      expect(localStorage.getItem('activeStoreProfileId')).toBe('2');
    });

    it('loads from localStorage on init', () => {
      localStorage.setItem('activeStoreProfileId', '2');
      const http = TestBed.inject(HttpClient);
      const freshService = new VStoreProfileService(http, configSvc);
      expect(freshService.getActiveProfileId()).toBe(2);
    });

    it('getActiveProfile returns matching profile after fetch', () => {
      service.getProfiles().subscribe();
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);

      service.setActiveProfile(mockProfiles[1]);
      const active = service.getActiveProfile();
      expect(active).toBeTruthy();
      expect(active!.name).toBe('Chicken Store');
    });

    it('emits via getActiveProfileId$', () => {
      let emittedId: number | null = null;
      service.getActiveProfileId$().subscribe((id) => (emittedId = id));
      expect(emittedId).toBeNull();

      service.setActiveProfile(mockProfiles[0]);
      expect(emittedId).toBe(1);
    });
  });

  describe('default profile selection', () => {
    it('sets default profile when no stored value exists', () => {
      service.getProfiles().subscribe((profiles) => {
        expect(profiles.length).toBeGreaterThan(0);
      });
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);

      expect(service.getActiveProfileId()).toBe(1);
    });

    it('falls back to first profile if stored id no longer exists', () => {
      localStorage.setItem('activeStoreProfileId', '999');
      const http = TestBed.inject(HttpClient);
      const freshService = new VStoreProfileService(http, configSvc);
      freshService.getProfiles().subscribe();
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);

      expect(freshService.getActiveProfileId()).toBe(1);
    });
  });

  describe('getProfilesSnapshot', () => {
    it('returns empty array before fetch', () => {
      expect(service.getProfilesSnapshot()).toEqual([]);
    });

    it('returns cached profiles after fetch', () => {
      service.getProfiles().subscribe();
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);

      expect(service.getProfilesSnapshot().length).toBe(3);
    });
  });

  describe('business configuration helpers', () => {
    beforeEach(() => {
      service.getProfiles().subscribe();
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);
      service.setActiveProfile(mockProfiles[0]);
    });

    it('getCurrency returns profile currency', () => {
      expect(service.getCurrency()).toBe('BOB');
    });

    it('getCurrency falls back to BOB for legacy profiles', () => {
      expect(service.getCurrency(mockProfiles[2])).toBe('BOB');
    });

    it('getCurrencySymbol returns profile symbol', () => {
      expect(service.getCurrencySymbol()).toBe('Bs');
    });

    it('getCurrencySymbol falls back to Bs for legacy profiles', () => {
      expect(service.getCurrencySymbol(mockProfiles[2])).toBe('Bs');
    });

    it('getLocale returns profile locale', () => {
      expect(service.getLocale()).toBe('es-BO');
    });

    it('getLocale falls back to es-BO for legacy profiles', () => {
      expect(service.getLocale(mockProfiles[2])).toBe('es-BO');
    });

    it('getTaxLabel returns profile tax label', () => {
      expect(service.getTaxLabel()).toBe('NIT');
    });

    it('getTaxLabel falls back to NIT for legacy profiles', () => {
      expect(service.getTaxLabel(mockProfiles[2])).toBe('NIT');
    });

    it('getTaxId returns profile tax ID', () => {
      expect(service.getTaxId()).toBe('1234567');
    });

    it('getTaxId falls back to empty for legacy profiles', () => {
      expect(service.getTaxId(mockProfiles[2])).toBe('');
    });

    it('getAddress returns profile address', () => {
      expect(service.getAddress()).toBe('Cochabamba, Bolivia');
    });

    it('getAddress falls back to empty for legacy profiles', () => {
      expect(service.getAddress(mockProfiles[2])).toBe('');
    });

    it('getBusinessName returns businessName field', () => {
      expect(service.getBusinessName()).toBe('Super Martinez');
    });

    it('getBusinessName falls back to name for legacy profiles', () => {
      expect(service.getBusinessName(mockProfiles[2])).toBe('Legacy Store');
    });

    it('getBusinessType returns businessType field', () => {
      expect(service.getBusinessType()).toBe('supermarket');
    });

    it('getBusinessType falls back to slug for legacy profiles', () => {
      expect(service.getBusinessType(mockProfiles[2])).toBe('legacy');
    });
  });

  describe('capabilities', () => {
    beforeEach(() => {
      service.getProfiles().subscribe();
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);
      service.setActiveProfile(mockProfiles[0]);
    });

    it('getCapabilities returns profile capabilities', () => {
      const caps = service.getCapabilities();
      expect(caps).toContain('BARCODE');
      expect(caps).toContain('WEIGHT_PRODUCTS');
      expect(caps).toContain('COMBOS');
    });

    it('getCapabilities falls back to defaults for legacy profiles', () => {
      const caps = service.getCapabilities(mockProfiles[2]);
      expect(caps).toContain('BARCODE');
      expect(caps).toContain('DISCOUNTS');
      expect(caps).toContain('CUSTOMERS');
    });

    it('hasCapability returns true for enabled capability', () => {
      expect(service.hasCapability('BARCODE')).toBe(true);
      expect(service.hasCapability('WEIGHT_PRODUCTS')).toBe(true);
    });

    it('hasCapability returns false for disabled capability', () => {
      expect(service.hasCapability('PRODUCT_VARIANTS')).toBe(false);
      expect(service.hasCapability('LOYALTY')).toBe(false);
    });

    it('hasCapability works with explicit profile parameter', () => {
      expect(service.hasCapability('COMBOS', mockProfiles[1])).toBe(true);
      expect(service.hasCapability('WEIGHT_PRODUCTS', mockProfiles[1])).toBe(false);
    });

    it('CAPABILITIES constant has all expected values', () => {
      expect(CAPABILITIES.BARCODE).toBe('BARCODE');
      expect(CAPABILITIES.WEIGHT_PRODUCTS).toBe('WEIGHT_PRODUCTS');
      expect(CAPABILITIES.VARIABLE_QUANTITY).toBe('VARIABLE_QUANTITY');
      expect(CAPABILITIES.LOT_TRACKING).toBe('LOT_TRACKING');
      expect(CAPABILITIES.EXPIRATION).toBe('EXPIRATION');
      expect(CAPABILITIES.PRODUCT_VARIANTS).toBe('PRODUCT_VARIANTS');
      expect(CAPABILITIES.COMBOS).toBe('COMBOS');
      expect(CAPABILITIES.DISCOUNTS).toBe('DISCOUNTS');
      expect(CAPABILITIES.CUSTOMERS).toBe('CUSTOMERS');
      expect(CAPABILITIES.SERIAL_NUMBERS).toBe('SERIAL_NUMBERS');
      expect(CAPABILITIES.TAX_CALCULATION).toBe('TAX_CALCULATION');
      expect(CAPABILITIES.LOYALTY).toBe('LOYALTY');
    });
  });

  describe('receipt and POS config', () => {
    beforeEach(() => {
      service.getProfiles().subscribe();
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);
      service.setActiveProfile(mockProfiles[0]);
    });

    it('getReceiptConfig returns profile config with defaults', () => {
      const config = service.getReceiptConfig();
      expect(config.paperWidth).toBe(80);
      expect(config.logo).toBe('logo.png');
      expect(config.headerLines).toEqual(['Welcome']);
      expect(config.footerLines).toEqual(['Thank you']);
    });

    it('getReceiptConfig returns defaults for legacy profiles', () => {
      const config = service.getReceiptConfig(mockProfiles[2]);
      expect(config.paperWidth).toBe(80);
      expect(config.logo).toBeUndefined();
      expect(config.headerLines).toEqual([]);
      expect(config.footerLines).toEqual([]);
    });

    it('getPosConfig returns profile config with defaults', () => {
      const config = service.getPosConfig();
      expect(config.catalogColumns).toBe(5);
      expect(config.showProductImages).toBe(true);
      expect(config.quickProducts).toEqual([1, 2]);
      expect(config.defaultSellingMode).toBe('UNIT');
    });

    it('getPosConfig returns defaults for legacy profiles', () => {
      const config = service.getPosConfig(mockProfiles[2]);
      expect(config.catalogColumns).toBe(4);
      expect(config.showProductImages).toBe(true);
      expect(config.quickProducts).toEqual([]);
      expect(config.defaultSellingMode).toBe('UNIT');
    });
  });
});
