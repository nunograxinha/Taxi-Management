import { TestBed } from '@angular/core/testing';

import { PedidoViagemService } from './pedido-viagem.service';

describe('PedidoViagemService', () => {
  let service: PedidoViagemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedidoViagemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
