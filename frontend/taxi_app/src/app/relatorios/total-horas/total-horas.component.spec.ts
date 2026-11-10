import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalHorasComponent } from './total-horas.component';

describe('TotalHorasComponent', () => {
  let component: TotalHorasComponent;
  let fixture: ComponentFixture<TotalHorasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TotalHorasComponent]
    });
    fixture = TestBed.createComponent(TotalHorasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
