import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerirMotoristasComponent } from './gerir-motoristas.component';

describe('GerirMotoristasComponent', () => {
  let component: GerirMotoristasComponent;
  let fixture: ComponentFixture<GerirMotoristasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GerirMotoristasComponent]
    });
    fixture = TestBed.createComponent(GerirMotoristasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
