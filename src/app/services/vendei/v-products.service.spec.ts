import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VProductsService } from './v-products.service';
import { VConfigService } from './v-config.service';

describe('VProductsService', () => {
  let service: VProductsService;
  let httpMock: HttpTestingController;
  let config: VConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VProductsService, VConfigService],
    });
    service = TestBed.inject(VProductsService);
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

  describe('getProducts', () => {
    it('fetches from productPresentations endpoint', () => {
      const mockProducts = [{ id: 1, name: 'Apple' }];
      service.getProducts().subscribe(products => {
        expect(products.length).toBe(1);
        expect(products[0].id).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('/productPresentations'));
      req.flush(mockProducts);
    });

    it('appends storeProfileId when profileId is provided', () => {
      service.getProducts(5).subscribe();
      const req = httpMock.expectOne(r => r.url.includes('storeProfileId=5'));
      req.flush([]);
    });

    it('does not append storeProfileId when not provided', () => {
      service.getProducts().subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/productPresentations'));
      expect(req.request.params.has('storeProfileId')).toBe(false);
      req.flush([]);
    });

    it('normalizes response from { data: [...] } wrapper', () => {
      service.getProducts().subscribe(products => {
        expect(products.length).toBe(2);
      });
      const req = httpMock.expectOne(r => r.url.includes('/productPresentations'));
      req.flush({ data: [{ id: 1 }, { id: 2 }] });
    });

    it('normalizes response from { rows: [...] } wrapper', () => {
      service.getProducts().subscribe(products => {
        expect(products.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('/productPresentations'));
      req.flush({ rows: [{ id: 1 }] });
    });

    it('returns empty array on error', () => {
      service.getProducts().subscribe(products => {
        expect(products).toEqual([]);
      });
      const req = httpMock.expectOne(r => r.url.includes('/productPresentations'));
      req.error(new ProgressEvent('error'));
    });
  });
});
