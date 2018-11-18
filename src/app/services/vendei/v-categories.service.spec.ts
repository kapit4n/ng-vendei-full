import { TestBed, inject } from '@angular/core/testing';

import { VCategoriesService } from './v-categories.service';

describe('VCategoriesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VCategoriesService]
    });
  });

  it('should be created', inject([VCategoriesService], (service: VCategoriesService) => {
    expect(service).toBeTruthy();
  }));
});
