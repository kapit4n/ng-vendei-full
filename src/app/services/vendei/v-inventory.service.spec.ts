import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VInventoryService } from './v-inventory.service';
import { VConfigService } from './v-config.service';

describe('VInventoryService', () => {
  let service: VInventoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VInventoryService, VConfigService],
    });
    service = TestBed.inject(VInventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('reduceInventory', () => {
    it('calls reduceInventory endpoint with productId and amount', () => {
      service.reduceInventory('1', 3).subscribe();

      const req = httpMock.expectOne(r =>
        r.url.includes('/products/reduceInventory') &&
        r.url.includes('id=1') &&
        r.url.includes('amount=3')
      );
      req.flush({ stock: 17 });
    });
  });

  describe('updateTotalSelled', () => {
    it('calls updateTotalSelled endpoint', () => {
      service.updateTotalSelled('1', 30).subscribe();

      const req = httpMock.expectOne(r =>
        r.url.includes('/products/updateTotalSelled') &&
        r.url.includes('id=1') &&
        r.url.includes('amount=30')
      );
      req.flush({});
    });
  });

  describe('updateQuantitySelled', () => {
    it('calls updateQuantitySelled endpoint', () => {
      service.updateQuantitySelled('1', 3).subscribe();

      const req = httpMock.expectOne(r =>
        r.url.includes('/products/updateQuantitySelled') &&
        r.url.includes('id=1') &&
        r.url.includes('amount=3')
      );
      req.flush({});
    });
  });
});
