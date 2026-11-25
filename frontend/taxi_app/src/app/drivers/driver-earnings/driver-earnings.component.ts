import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DriverService } from '../../appServices/driver.service';
import { AuthService } from '../../appServices/auth.service';
import { TripService } from '../../appServices/trip.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { SocketService } from '../../appServices/socket.service';
import { Driver } from '../driver.interface';
import { Trip } from '../../trips/trip.interface';

export interface EarningsBucket {
  key: string;
  label: string;
  earnings: number;
  trips: number;
  kms: number;
}

export type EarningsPeriod = 'today' | '7d' | 'month' | 'all';
export type EarningsChartMetric = 'earnings' | 'trips';

@Component({
  selector: 'app-driver-earnings',
  templateUrl: './driver-earnings.component.html',
  styleUrls: ['./driver-earnings.component.css']
})
export class DriverEarningsComponent implements OnInit, OnDestroy {
  driver: Driver | null = null;
  allTrips: Trip[] = [];
  periodTrips: Trip[] = [];
  period: EarningsPeriod = 'month';
  chartMetric: EarningsChartMetric = 'earnings';
  trendBuckets: EarningsBucket[] = [];
  maxBucketValue = 0;
  hoveredBucket: EarningsBucket | null = null;
  searchTerm = '';
  isLoading = true;
  loadError = '';
  resolvedAddresses: Record<string, string> = {};

  private subs = new Subscription();
  private lastLoadedDriverId = '';

  constructor(
    private driverService: DriverService,
    private authService: AuthService,
    private tripService: TripService,
    private geolocationService: GeolocationService,
    private socketService: SocketService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.driverService.driver$.subscribe((drv) => {
        if (drv && drv._id) {
          this.driver = drv;
          if (this.lastLoadedDriverId !== drv._id) {
            this.lastLoadedDriverId = drv._id;
            this.loadTrips(drv._id);
          }
        }
      })
    );

    if (!this.driverService.getDriver()) {
      const nif = this.authService.getDriverNif();
      if (nif) {
        this.driverService.getDriverByNIF(nif).subscribe({
          next: (drv) => {
            if (drv) {
              this.driverService.setDriver(drv);
            } else {
              this.isLoading = false;
              this.loadError = 'Could not load driver profile.';
            }
          },
          error: () => {
            this.isLoading = false;
            this.loadError = 'Could not load driver profile.';
          }
        });
      } else {
        this.isLoading = false;
        this.loadError = 'Driver NIF not found.';
      }
    }

    this.subs.add(
      this.socketService
        .onEvent<{ driverId: string; ratingAverage: number; ratingCount: number }>('driver:ratingUpdated')
        .subscribe((ev) => {
          this.ngZone.run(() => {
            if (ev && this.driver?._id && String(ev.driverId) === String(this.driver._id)) {
              this.driver.ratingAverage = ev.ratingAverage;
              this.driver.ratingCount = ev.ratingCount;
              this.loadTrips(this.driver._id);
            }
          });
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadTrips(driverId: string): void {
    this.isLoading = true;
    this.loadError = '';
    this.tripService.getTripsByDriver(driverId).subscribe({
      next: (trips) => {
        this.allTrips = (trips || []).sort((a, b) => {
          const tb = new Date(b.exitTime || b.entryTime).getTime();
          const ta = new Date(a.exitTime || a.entryTime).getTime();
          return tb - ta;
        });
        this.isLoading = false;
        this.rebuildDerivedData();
        this.resolveTripAddresses(this.allTrips);
      },
      error: (err) => {
        console.error('Error loading driver earnings:', err);
        this.loadError = 'Could not load earnings history. Please try again.';
        this.isLoading = false;
      }
    });
  }

  setPeriod(period: EarningsPeriod): void {
    if (this.period === period) return;
    this.period = period;
    this.hoveredBucket = null;
    this.rebuildDerivedData();
  }

  setChartMetric(metric: EarningsChartMetric): void {
    this.chartMetric = metric;
    this.recomputeMaxBucketValue();
  }

  setHoveredBucket(bucket: EarningsBucket | null): void {
    this.hoveredBucket = bucket;
  }

  get filteredTrips(): Trip[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.periodTrips;

    return this.periodTrips.filter((t) => {
      const passenger = this.getPassengerName(t).toLowerCase();
      const entry = (t.entryAddressLabel || this.formatAddress(t.entryAddress)).toLowerCase();
      const exit = (t.exitAddressLabel || this.formatAddress(t.exitAddress)).toLowerCase();
      const comment = (t.ratingComment || '').toLowerCase();
      return (
        passenger.includes(q) ||
        entry.includes(q) ||
        exit.includes(q) ||
        comment.includes(q)
      );
    });
  }

  get totalEarnings(): number {
    return this.periodTrips.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  }

  get averagePerTrip(): number {
    return this.periodTrips.length > 0 ? this.totalEarnings / this.periodTrips.length : 0;
  }

  get totalKm(): number {
    return this.periodTrips.reduce((sum, t) => sum + (Number(t.distanceKm) || 0), 0);
  }

  get totalDurationMinutes(): number {
    return this.periodTrips.reduce((sum, t) => sum + this.getTripDurationMinutes(t), 0);
  }

  get totalDurationFormatted(): string {
    const mins = this.totalDurationMinutes;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }

  get periodRatedCount(): number {
    return this.periodTrips.filter((t) => typeof t.rating === 'number' && t.rating >= 1 && t.rating <= 5).length;
  }

  get periodAverageRating(): number {
    const rated = this.periodTrips.filter((t) => typeof t.rating === 'number' && t.rating >= 1 && t.rating <= 5);
    if (rated.length === 0) return 0;
    const sum = rated.reduce((acc, t) => acc + Number(t.rating || 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }

  get chartTitle(): string {
    if (this.period === 'today') return 'Hourly Breakdown';
    if (this.period === 'all' && this.useMonthlyBucketsForAllTime()) return 'Monthly Breakdown';
    return 'Daily Breakdown';
  }

  getBucketValue(bucket: EarningsBucket): number {
    return this.chartMetric === 'earnings' ? bucket.earnings : bucket.trips;
  }

  getBucketHeightPct(bucket: EarningsBucket): number {
    if (this.maxBucketValue <= 0) return 0;
    const val = this.getBucketValue(bucket);
    if (val <= 0) return 0;
    return Math.max(8, Math.round((val / this.maxBucketValue) * 100));
  }

  formatBucketTopValue(bucket: EarningsBucket): string {
    return this.chartMetric === 'earnings'
      ? `€${bucket.earnings.toFixed(0)}`
      : String(bucket.trips);
  }

  formatBucketTooltip(bucket: EarningsBucket): string {
    return `${bucket.label}: €${bucket.earnings.toFixed(2)} · ${bucket.trips} ${bucket.trips === 1 ? 'trip' : 'trips'}`;
  }

  getPassengerName(trip: Trip): string {
    if (trip.client && typeof trip.client === 'object' && trip.client.name) {
      return trip.client.name;
    }
    return 'Passenger';
  }

  getTripDurationMinutes(trip: Trip): number {
    if (!trip.entryTime || !trip.exitTime) return 0;
    const start = new Date(trip.entryTime).getTime();
    const end = new Date(trip.exitTime).getTime();
    return Math.max(0, Math.round((end - start) / 60000));
  }

  formatAddress(raw: string): string {
    return this.resolvedAddresses[raw] || raw;
  }

  isSameDay(a: string | Date, b: string | Date): boolean {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  exportCsv(): void {
    if (this.periodTrips.length === 0) return;

    const escapeCell = (val: unknown): string => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Start Time',
      'End Time',
      'Duration (min)',
      'Passenger',
      'Pickup',
      'Destination',
      'Distance (km)',
      'Earnings (EUR)',
      'Rating',
      'Comment'
    ];

    const rows = this.periodTrips.map((t) => [
      new Date(t.entryTime).toISOString(),
      new Date(t.exitTime).toISOString(),
      this.getTripDurationMinutes(t),
      this.getPassengerName(t),
      t.entryAddressLabel || this.formatAddress(t.entryAddress),
      t.exitAddressLabel || this.formatAddress(t.exitAddress),
      (Number(t.distanceKm) || 0).toFixed(2),
      (Number(t.price) || 0).toFixed(2),
      t.rating ?? '',
      t.ratingComment || ''
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `driver-earnings-${this.period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private rebuildDerivedData(): void {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    this.periodTrips = this.allTrips.filter((t) => {
      const ref = new Date(t.exitTime || t.entryTime);
      if (Number.isNaN(ref.getTime())) return false;

      if (this.period === 'today') {
        return ref >= startOfToday;
      }
      if (this.period === '7d') {
        const start7d = new Date(startOfToday);
        start7d.setDate(start7d.getDate() - 6);
        return ref >= start7d;
      }
      if (this.period === 'month') {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return ref >= startMonth;
      }
      return true;
    });

    this.trendBuckets = this.buildTrendBuckets(now, startOfToday);
    this.recomputeMaxBucketValue();
  }

  private useMonthlyBucketsForAllTime(): boolean {
    if (this.allTrips.length === 0) return false;
    const times = this.allTrips
      .map((t) => new Date(t.exitTime || t.entryTime).getTime())
      .filter((ms) => Number.isFinite(ms));
    if (times.length === 0) return false;
    const minMs = Math.min(...times);
    const maxMs = Math.max(...times);
    return maxMs - minMs > 31 * 24 * 60 * 60 * 1000;
  }

  private buildTrendBuckets(now: Date, startOfToday: Date): EarningsBucket[] {
    if (this.period === 'today') {
      const map = new Map<number, EarningsBucket>();
      for (let h = 0; h < 24; h++) {
        const label = `${h.toString().padStart(2, '0')}h`;
        map.set(h, { key: label, label, earnings: 0, trips: 0, kms: 0 });
      }
      for (const t of this.periodTrips) {
        const h = new Date(t.exitTime || t.entryTime).getHours();
        const b = map.get(h);
        if (b) {
          b.earnings += Number(t.price) || 0;
          b.trips += 1;
          b.kms += Number(t.distanceKm) || 0;
        }
      }
      return Array.from(map.values());
    }

    if (this.period === 'all' && this.useMonthlyBucketsForAllTime()) {
      const map = new Map<string, EarningsBucket>();
      const sorted = [...this.periodTrips].sort(
        (a, b) => new Date(a.exitTime || a.entryTime).getTime() - new Date(b.exitTime || b.entryTime).getTime()
      );
      for (const t of sorted) {
        const d = new Date(t.exitTime || t.entryTime);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const label = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        if (!map.has(key)) {
          map.set(key, { key, label, earnings: 0, trips: 0, kms: 0 });
        }
        const b = map.get(key)!;
        b.earnings += Number(t.price) || 0;
        b.trips += 1;
        b.kms += Number(t.distanceKm) || 0;
      }
      return Array.from(map.values());
    }

    let rangeStart = new Date(startOfToday);
    if (this.period === '7d') {
      rangeStart.setDate(rangeStart.getDate() - 6);
    } else if (this.period === 'month') {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (this.periodTrips.length > 0) {
      const oldest = this.periodTrips[this.periodTrips.length - 1];
      const d = new Date(oldest.exitTime || oldest.entryTime);
      rangeStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const map = new Map<string, EarningsBucket>();
    const cursor = new Date(rangeStart);
    while (cursor <= startOfToday) {
      const key = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, '0')}-${cursor.getDate().toString().padStart(2, '0')}`;
      const label = `${cursor.getDate().toString().padStart(2, '0')}/${(cursor.getMonth() + 1).toString().padStart(2, '0')}`;
      map.set(key, { key, label, earnings: 0, trips: 0, kms: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const t of this.periodTrips) {
      const d = new Date(t.exitTime || t.entryTime);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const b = map.get(key);
      if (b) {
        b.earnings += Number(t.price) || 0;
        b.trips += 1;
        b.kms += Number(t.distanceKm) || 0;
      }
    }

    return Array.from(map.values());
  }

  private recomputeMaxBucketValue(): void {
    this.maxBucketValue = this.trendBuckets.reduce(
      (max, b) => Math.max(max, this.getBucketValue(b)),
      0
    );
  }

  private resolveTripAddresses(trips: Trip[]): void {
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
