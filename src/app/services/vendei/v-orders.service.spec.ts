import { TestBed, inject } from '@angular/core/testing';

import { VOrdersService } from './v-orders.service';

describe('VOrdersService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VOrdersService]
    });
  });

  it('should be created', inject([VOrdersService], (service: VOrdersService) => {
    expect(service).toBeTruthy();
  }));
});
