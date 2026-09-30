import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ApiClientService } from './api-client.service';
import { API_PATHS } from './api-paths';

describe('ApiClientService', () => {
  let api: ApiClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiClientService, provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(ApiClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('calls a collection without a trailing slash so nginx proxies it', () => {
    api.get(API_PATHS.products).subscribe();
    httpMock.expectOne((req) => req.url === '/products').flush([]);
  });

  it('keeps the raw query string when none is supplied', () => {
    api.get(API_PATHS.products, 'categoryId=1&active=true').subscribe();
    httpMock.expectOne((req) => req.url === '/products?categoryId=1&active=true').flush([]);
  });

  it('serialises a query record and drops null values', () => {
    api.get(API_PATHS.orders, { profileId: 3, paid: false, note: null }).subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith('/orders'));
    expect(req.request.url).toBe('/orders?profileId=3&paid=false');
    expect(req.request.urlWithParams).not.toContain('note');
    req.flush([]);
  });

  it('returns the exact request URL with no query when there is no filter', () => {
    api.get(API_PATHS.categories).subscribe();
    const req = httpMock.expectOne((r) => r.url.startsWith('/categories'));
    expect(req.request.urlWithParams).toBe('/categories');
    req.flush([]);
  });

  it('sends a body on post and resolves against the API base', () => {
    api.post(API_PATHS.orders, { total: 5 }).subscribe();
    const req = httpMock.expectOne(API_PATHS.orders);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ total: 5 });
    req.flush({});
  });

  it('never lets a caller smuggle a host through a leading slash', () => {
    api.get('https://evil.example.com/steal').subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('evil.example.com'));
    expect(req.request.url).toContain('/https://evil.example.com/steal');
  });

  it('keeps the shared path table aligned with the mounted backend routes', () => {
    expect(API_PATHS.products).toBe('/products');
    expect(API_PATHS.orderDetails).toBe('/orderDetails');
    expect(API_PATHS.purchaseItems).toBe('/purchase-items');
    expect(API_PATHS.angQuestions).toBe('/ang-questions');
  });

  it('surfaces the raw error to callers instead of swallowing it', () => {
    let captured: unknown;
    api.get(API_PATHS.products).subscribe({ error: (err) => (captured = err) });
    httpMock.expectOne(() => true).flush('boom', { status: 500, statusText: 'Server Error' });
    expect(captured).toBeTruthy();
  });
});
