import { TestBed, inject } from '@angular/core/testing';

import { VProductsService } from './v-products.service';

describe('VProductsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VProductsService]
    });
  });

  it('should be created', inject([VProductsService], (service: VProductsService) => {
    expect(service).toBeTruthy();
  }));
});
