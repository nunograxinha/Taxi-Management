import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerTaxisComponent } from './ver-taxis.component';

describe('VerTaxisComponent', () => {
  let component: VerTaxisComponent;
  let fixture: ComponentFixture<VerTaxisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VerTaxisComponent]
    });
    fixture = TestBed.createComponent(VerTaxisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
