import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcompanharViagemComponent } from './acompanhar-viagem.component';

describe('AcompanharViagemComponent', () => {
  let component: AcompanharViagemComponent;
  let fixture: ComponentFixture<AcompanharViagemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AcompanharViagemComponent]
    });
    fixture = TestBed.createComponent(AcompanharViagemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
