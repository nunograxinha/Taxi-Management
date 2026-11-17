import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotoristaLoginComponent } from './driver-login.component';

describe('MotoristaLoginComponent', () => {
  let component: MotoristaLoginComponent;
  let fixture: ComponentFixture<MotoristaLoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MotoristaLoginComponent]
    });
    fixture = TestBed.createComponent(MotoristaLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
