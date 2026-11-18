import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverPageComponent } from './driver-page.component';

describe('DriverPageComponent', () => {
  let component: DriverPageComponent;
  let fixture: ComponentFixture<DriverPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriverPageComponent]
    });
    fixture = TestBed.createComponent(DriverPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
