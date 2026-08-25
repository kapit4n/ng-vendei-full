import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VCategoriesService } from './v-categories.service';
import { VConfigService } from './v-config.service';

describe('VCategoriesService', () => {
  let service: VCategoriesService;
  let httpMock: HttpTestingController;
  let config: VConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VCategoriesService, VConfigService],
    });
    service = TestBed.inject(VCategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
    config = TestBed.inject(VConfigService);
    config.isTest = false;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('fetches from categories endpoint', () => {
      const mockCategories = [{ id: 1, name: 'Fruits' }];
      service.getAll().subscribe(cats => {
        expect(cats.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('/categories'));
      req.flush(mockCategories);
    });

    it('appends storeProfileId when profileId is provided', () => {
      service.getAll(3).subscribe();
      const req = httpMock.expectOne(r => r.url.includes('storeProfileId=3'));
      req.flush([]);
    });

    it('normalizes { data: [...] } response', () => {
      service.getAll().subscribe(cats => {
        expect(cats.length).toBe(2);
      });
      const req = httpMock.expectOne(r => r.url.includes('/categories'));
      req.flush({ data: [{ id: 1 }, { id: 2 }] });
    });

    it('normalizes { Categories: [...] } response', () => {
      service.getAll().subscribe(cats => {
        expect(cats.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('/categories'));
      req.flush({ Categories: [{ id: 1 }] });
    });

    it('returns empty array on error', () => {
      service.getAll().subscribe(cats => {
        expect(cats).toEqual([]);
      });
      const req = httpMock.expectOne(r => r.url.includes('/categories'));
      req.error(new ProgressEvent('error'));
    });
  });
});
