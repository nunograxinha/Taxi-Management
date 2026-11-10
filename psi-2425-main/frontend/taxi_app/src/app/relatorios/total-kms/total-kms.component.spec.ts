import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalKmsComponent } from './total-kms.component';

describe('TotalKmsComponent', () => {
  let component: TotalKmsComponent;
  let fixture: ComponentFixture<TotalKmsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TotalKmsComponent]
    });
    fixture = TestBed.createComponent(TotalKmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
