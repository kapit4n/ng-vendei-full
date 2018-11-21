import { TestBed, inject } from '@angular/core/testing';

import { RepConfigService } from './rep-config.service';

describe('RepConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RepConfigService]
    });
  });

  it('should be created', inject([RepConfigService], (service: RepConfigService) => {
    expect(service).toBeTruthy();
  }));
});
