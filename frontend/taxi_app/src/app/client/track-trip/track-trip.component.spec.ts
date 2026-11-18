import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackTripComponent } from './track-trip.component';

describe('TrackTripComponent', () => {
  let component: TrackTripComponent;
  let fixture: ComponentFixture<TrackTripComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TrackTripComponent]
    });
    fixture = TestBed.createComponent(TrackTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
