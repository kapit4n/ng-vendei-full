import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VCustomersService } from './v-customers.service';
import { VConfigService } from './v-config.service';

describe('VCustomersService', () => {
  let service: VCustomersService;
  let httpMock: HttpTestingController;
  let config: VConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VCustomersService, VConfigService],
    });
    service = TestBed.inject(VCustomersService);
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
    it('fetches from /clients endpoint in API mode', () => {
      const mockCustomers = [{ id: 1, name: 'Juan' }];
      service.getAll().subscribe(customers => {
        expect(customers.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('/clients'));
      req.flush(mockCustomers);
    });
  });
});
