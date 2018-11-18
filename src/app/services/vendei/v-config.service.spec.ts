import { TestBed, inject } from '@angular/core/testing';

import { VConfigService } from './v-config.service';

describe('VConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VConfigService]
    });
  });

  it('should be created', inject([VConfigService], (service: VConfigService) => {
    expect(service).toBeTruthy();
  }));
});
