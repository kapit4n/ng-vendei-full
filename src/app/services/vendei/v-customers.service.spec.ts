import { TestBed, inject } from '@angular/core/testing';

import { VCustomersService } from './v-customers.service';

describe('VCustomersService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VCustomersService]
    });
  });

  it('should be created', inject([VCustomersService], (service: VCustomersService) => {
    expect(service).toBeTruthy();
  }));
});
