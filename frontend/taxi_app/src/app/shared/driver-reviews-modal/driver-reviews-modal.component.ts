import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TripService } from '../../appServices/trip.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { Trip } from '../../trips/trip.interface';

@Component({
  selector: 'app-driver-reviews-modal',
  templateUrl: './driver-reviews-modal.component.html',
  styleUrls: ['./driver-reviews-modal.component.css']
})
export class DriverReviewsModalComponent implements OnInit, OnChanges {
  @Input() driverId: string = '';
  @Input() driverName: string = '';
  @Input() title: string = 'Driver Reviews';
  @Input() ratingAverage: number = 0;
  @Input() ratingCount: number = 0;
  @Output() close = new EventEmitter<void>();

  isLoading = false;
  loadError = '';
  ratedTrips: Trip[] = [];
  filterMode: 'all' | 'comments' = 'all';
  resolvedAddresses: Record<string, string> = {};
  readonly starLevels = [5, 4, 3, 2, 1];

  constructor(
    private tripService: TripService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driverId'] && !changes['driverId'].firstChange) {
      this.loadReviews();
    }
  }

  loadReviews(): void {
    if (!this.driverId) {
      this.ratedTrips = [];
      return;
    }

    this.isLoading = true;
    this.loadError = '';
    this.tripService.getTripsByDriver(this.driverId).subscribe({
      next: (trips) => {
        this.ratedTrips = (trips || [])
          .filter((t) => typeof t.rating === 'number' && t.rating >= 1 && t.rating <= 5)
          .sort((a, b) => {
            const timeB = new Date(b.exitTime || b.entryTime).getTime();
            const timeA = new Date(a.exitTime || a.entryTime).getTime();
            return timeB - timeA;
          });
        this.isLoading = false;
        this.resolveAddresses(this.ratedTrips);
      },
      error: (err) => {
        console.error('Error loading driver reviews:', err);
        this.loadError = 'Could not load reviews. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get totalReviewsCount(): number {
    return this.isLoading ? this.ratingCount : this.ratedTrips.length;
  }

  get computedAverage(): number {
    if (this.isLoading || this.ratedTrips.length === 0) {
      return this.ratingAverage || 0;
    }
    const sum = this.ratedTrips.reduce((acc, t) => acc + Number(t.rating || 0), 0);
    return Math.round((sum / this.ratedTrips.length) * 10) / 10;
  }

  get commentsCount(): number {
    return this.ratedTrips.filter((t) => Boolean(t.ratingComment && t.ratingComment.trim())).length;
  }

  get visibleReviews(): Trip[] {
    if (this.filterMode === 'comments') {
      return this.ratedTrips.filter((t) => Boolean(t.ratingComment && t.ratingComment.trim()));
    }
    return this.ratedTrips;
  }

  getStarCount(level: number): number {
    return this.ratedTrips.filter((t) => Number(t.rating) === level).length;
  }

  getStarPct(level: number): number {
    const total = this.ratedTrips.length;
    if (total === 0) return 0;
    return Math.round((this.getStarCount(level) / total) * 100);
  }

  getPassengerName(trip: Trip): string {
    if (trip.client && typeof trip.client === 'object' && trip.client.name) {
      return trip.client.name;
    }
    return 'Passenger';
  }

  formatAddress(raw: string): string {
    return this.resolvedAddresses[raw] || raw;
  }

  getStarFillPercentages(rating: number): number[] {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
    return [1, 2, 3, 4, 5].map((index) => {
      const fill = Math.max(0, Math.min(1, safeRating - (index - 1)));
      if (fill <= 0) return 0;
      if (fill >= 1) return 100;
      return Math.round(20 + fill * 60);
    });
  }

  setFilter(mode: 'all' | 'comments'): void {
    this.filterMode = mode;
  }

  onClose(): void {
    this.close.emit();
  }

  private resolveAddresses(trips: Trip[]): void {
    const rawSet = new Set<string>();
    trips.forEach((t) => {
      if (t.entryAddress && !t.entryAddressLabel) rawSet.add(t.entryAddress);
      if (t.exitAddress && !t.exitAddressLabel) rawSet.add(t.exitAddress);
    });

    rawSet.forEach((raw) => {
      if (this.geolocationService.isCoordinateString(raw) && !this.resolvedAddresses[raw]) {
        void this.geolocationService.resolveDisplayAddress(raw).then((resolved) => {
          this.resolvedAddresses[raw] = resolved;
        });
      }
    });
  }
}
