import { TestBed, inject } from '@angular/core/testing';

import { VInventoryService } from './v-inventory.service';

describe('VInventoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VInventoryService]
    });
  });

  it('should be created', inject([VInventoryService], (service: VInventoryService) => {
    expect(service).toBeTruthy();
  }));
});
