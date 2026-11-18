import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulatePriceComponent } from './simulate-price.component';

describe('SimulatePriceComponent', () => {
  let component: SimulatePriceComponent;
  let fixture: ComponentFixture<SimulatePriceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SimulatePriceComponent]
    });
    fixture = TestBed.createComponent(SimulatePriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
