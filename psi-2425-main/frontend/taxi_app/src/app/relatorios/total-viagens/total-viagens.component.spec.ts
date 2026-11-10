import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalViagensComponent } from './total-viagens.component';

describe('TotalViagensComponent', () => {
  let component: TotalViagensComponent;
  let fixture: ComponentFixture<TotalViagensComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TotalViagensComponent]
    });
    fixture = TestBed.createComponent(TotalViagensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
