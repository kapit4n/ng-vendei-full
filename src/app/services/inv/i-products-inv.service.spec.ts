import { TestBed, inject } from '@angular/core/testing';

import { IProductsInvService } from './i-products-inv.service';

describe('IProductsInvService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IProductsInvService]
    });
  });

  it('should be created', inject([IProductsInvService], (service: IProductsInvService) => {
    expect(service).toBeTruthy();
  }));
});
