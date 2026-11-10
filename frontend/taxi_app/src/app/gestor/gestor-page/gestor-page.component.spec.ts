import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestorPageComponent } from './gestor-page.component';

describe('GestorPageComponent', () => {
  let component: GestorPageComponent;
  let fixture: ComponentFixture<GestorPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GestorPageComponent]
    });
    fixture = TestBed.createComponent(GestorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
