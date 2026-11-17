import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoViagemComponent } from './ride-request.component';

describe('PedidoViagemComponent', () => {
  let component: PedidoViagemComponent;
  let fixture: ComponentFixture<PedidoViagemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PedidoViagemComponent]
    });
    fixture = TestBed.createComponent(PedidoViagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
