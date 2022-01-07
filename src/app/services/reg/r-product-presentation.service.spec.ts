import { TestBed, inject } from '@angular/core/testing';

import { RProductPresentationService } from './r-product-presentation.service';

describe('RProductPresentationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RProductPresentationService]
    });
  });

  it('should be created', inject([RProductPresentationService], (service: RProductPresentationService) => {
    expect(service).toBeTruthy();
  }));
});
