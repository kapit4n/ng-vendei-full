import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VOrdersService } from './v-orders.service';
import { VConfigService } from './v-config.service';

describe('VOrdersService', () => {
  let service: VOrdersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VOrdersService, VConfigService],
    });
    service = TestBed.inject(VOrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('save', () => {
    it('POSTs order to /orders endpoint', () => {
      const order = { customerId: 1, total: 100, paid: true };
      const response = { id: 99, ...order };

      service.save(order).subscribe(result => {
        expect(result.id).toBe(99);
      });

      const req = httpMock.expectOne(r => r.url.includes('/orders') && r.method === 'POST');
      expect(req.request.body).toEqual(order);
      req.flush(response);
    });
  });

  describe('saveDetail', () => {
    it('POSTs order detail to /orderDetails endpoint', () => {
      const detail = { orderId: 99, productId: 1, quantity: 2, currentPrice: 10 };

      service.saveDetail(detail).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(r => r.url.includes('/orderDetails') && r.method === 'POST');
      expect(req.request.body).toEqual(detail);
      req.flush({ id: 1 });
    });
  });

  describe('getAll', () => {
    it('GETs all orders from /orders endpoint', () => {
      const mockOrders = [{ id: 1 }, { id: 2 }];

      service.getAll().subscribe(orders => {
        expect(orders.length).toBe(2);
      });

      const req = httpMock.expectOne(r => r.url.includes('/orders') && r.method === 'GET');
      req.flush(mockOrders);
    });
  });
});
