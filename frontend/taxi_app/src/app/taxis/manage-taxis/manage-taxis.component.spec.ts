import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTaxisComponent } from './manage-taxis.component';

describe('ManageTaxisComponent', () => {
  let component: ManageTaxisComponent;
  let fixture: ComponentFixture<ManageTaxisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageTaxisComponent]
    });
    fixture = TestBed.createComponent(ManageTaxisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
