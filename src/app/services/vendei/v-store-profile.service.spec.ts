import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VStoreProfileService, StoreProfile } from './v-store-profile.service';
import { VConfigService } from './v-config.service';

describe('VStoreProfileService', () => {
  let service: VStoreProfileService;
  let httpMock: HttpTestingController;
  let configSvc: VConfigService;

  const mockProfiles: StoreProfile[] = [
    { id: 1, name: 'Supermarket', slug: 'supermarket', description: 'Groceries', active: true, defaultProfile: true },
    { id: 2, name: 'Chicken Store', slug: 'chicken-store', description: 'Chicken', active: true, defaultProfile: false },
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
        expect(profiles.length).toBe(2);
        expect(profiles[0].name).toBe('Supermarket');
      });
      const req = httpMock.expectOne(`${configSvc.baseUrl}/storeProfiles`);
      req.flush(mockProfiles);
    });

    it('normalizes nested response', () => {
      service.getProfiles().subscribe((profiles) => {
        expect(profiles.length).toBe(2);
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
});
