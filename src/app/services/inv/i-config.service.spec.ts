import { TestBed, inject } from '@angular/core/testing';

import { IConfigService } from './i-config.service';

describe('IConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IConfigService]
    });
  });

  it('should be created', inject([IConfigService], (service: IConfigService) => {
    expect(service).toBeTruthy();
  }));
});
