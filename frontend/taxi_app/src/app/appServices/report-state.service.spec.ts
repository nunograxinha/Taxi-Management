import { TestBed } from '@angular/core/testing';

import { RelatorioStateService } from './report-state.service';

describe('RelatorioStateService', () => {
  let service: RelatorioStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelatorioStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
