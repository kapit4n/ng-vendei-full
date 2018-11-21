import { TestBed, inject } from '@angular/core/testing';

import { RepSellsService } from './rep-sells.service';

describe('RepSellsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RepSellsService]
    });
  });

  it('should be created', inject([RepSellsService], (service: RepSellsService) => {
    expect(service).toBeTruthy();
  }));
});
