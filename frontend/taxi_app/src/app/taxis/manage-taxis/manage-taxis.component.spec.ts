import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerirTaxisComponent } from './manage-taxis.component';

describe('GerirTaxisComponent', () => {
  let component: GerirTaxisComponent;
  let fixture: ComponentFixture<GerirTaxisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GerirTaxisComponent]
    });
    fixture = TestBed.createComponent(GerirTaxisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
