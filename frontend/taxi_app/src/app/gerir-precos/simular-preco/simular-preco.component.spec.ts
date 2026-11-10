import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimularPrecoComponent } from './simular-preco.component';

describe('SimularPrecoComponent', () => {
  let component: SimularPrecoComponent;
  let fixture: ComponentFixture<SimularPrecoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SimularPrecoComponent]
    });
    fixture = TestBed.createComponent(SimularPrecoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
