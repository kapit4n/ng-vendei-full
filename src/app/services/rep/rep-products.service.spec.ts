import { TestBed, inject } from '@angular/core/testing';

import { RepProductsService } from './rep-products.service';

describe('RepProductsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RepProductsService]
    });
  });

  it('should be created', inject([RepProductsService], (service: RepProductsService) => {
    expect(service).toBeTruthy();
  }));
});
