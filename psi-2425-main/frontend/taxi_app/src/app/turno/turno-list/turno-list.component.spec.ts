import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnoListComponent } from './turno-list.component';

describe('TurnoListComponent', () => {
  let component: TurnoListComponent;
  let fixture: ComponentFixture<TurnoListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TurnoListComponent]
    });
    fixture = TestBed.createComponent(TurnoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
