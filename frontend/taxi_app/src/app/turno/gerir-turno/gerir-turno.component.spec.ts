import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerirTurnoComponent } from './gerir-turno.component';

describe('GerirTurnoComponent', () => {
  let component: GerirTurnoComponent;
  let fixture: ComponentFixture<GerirTurnoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GerirTurnoComponent]
    });
    fixture = TestBed.createComponent(GerirTurnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
