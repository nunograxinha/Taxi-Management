import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmarViagemComponent } from './confirm-trip.component';

describe('ConfirmarViagemComponent', () => {
  let component: ConfirmarViagemComponent;
  let fixture: ComponentFixture<ConfirmarViagemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmarViagemComponent]
    });
    fixture = TestBed.createComponent(ConfirmarViagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
