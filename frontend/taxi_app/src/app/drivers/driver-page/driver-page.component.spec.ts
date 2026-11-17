import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotoristaPageComponent } from './driver-page.component';

describe('MotoristaPageComponent', () => {
  let component: MotoristaPageComponent;
  let fixture: ComponentFixture<MotoristaPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MotoristaPageComponent]
    });
    fixture = TestBed.createComponent(MotoristaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
