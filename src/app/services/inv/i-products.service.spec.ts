import { TestBed, inject } from '@angular/core/testing';

import { IProductsService } from './i-products.service';

describe('IProductsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IProductsService]
    });
  });

  it('should be created', inject([IProductsService], (service: IProductsService) => {
    expect(service).toBeTruthy();
  }));
});
