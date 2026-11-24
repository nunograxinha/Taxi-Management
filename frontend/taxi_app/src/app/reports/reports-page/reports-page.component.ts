import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReportStateService } from '../../appServices/report-state.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { Trip } from '../../trips/trip.interface';

export interface TrendBucket {
  key: string;
  label: string;
  revenue: number;
  trips: number;
  kms: number;
}

export interface ComfortStat {
  trips: number;
  revenue: number;
  pct: number;
}

export interface DriverRankItem {
  id: string;
  name: string;
  trips: number;
  revenue: number;
  ratingAverage: number;
  ratingCount: number;
  widthPct: number;
}

@Component({
  selector: 'app-relatorios-page',
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.css']
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  viagens: Trip[] = [];
  startDate: string = '';
  endDate: string = '';
  todayDate: string = '';

  trendMetric: 'revenue' | 'trips' | 'kms' = 'revenue';
  comfortMetric: 'revenue' | 'trips' = 'revenue';
  trendBuckets: TrendBucket[] = [];
  hoveredBucket: TrendBucket | null = null;
  basicStats: ComfortStat = { trips: 0, revenue: 0, pct: 0 };
  luxuryStats: ComfortStat = { trips: 0, revenue: 0, pct: 0 };
  topDrivers: DriverRankItem[] = [];
  readonly donutRadius = 56;
  readonly donutCircumference = 2 * Math.PI * 56;

  private subs = new Subscription();

  constructor(
    private relatorioState: ReportStateService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    this.todayDate = this.relatorioState.getTodayDateString();
    const currentRange = this.relatorioState.getDateRange();
    this.startDate = currentRange.startDate;
    this.endDate = currentRange.endDate;

    this.relatorioState.atualizarViagens();

    this.subs.add(
      this.relatorioState.getDateRange$().subscribe(range => {
        this.startDate = range.startDate;
        this.endDate = range.endDate;
        this.rebuildCharts();
      })
    );

    this.subs.add(
      this.relatorioState.getViagensHoje$().subscribe(viagensArray => {
        this.viagens = viagensArray;
        this.rebuildCharts();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.relatorioState.setDateRange(input.value, this.endDate);
    }
  }

  onEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const nextStart = this.startDate > input.value ? input.value : this.startDate;
      this.relatorioState.setDateRange(nextStart, input.value);
    }
  }

  selectToday(): void {
    this.todayDate = this.relatorioState.getTodayDateString();
    this.relatorioState.setDateRange(this.todayDate, this.todayDate);
  }

  selectLast7Days(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    this.relatorioState.setDateRange(this.toIsoDate(start), this.toIsoDate(end));
  }

  selectThisMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    this.relatorioState.setDateRange(this.toIsoDate(start), this.toIsoDate(now));
  }

  isToday(): boolean {
    return this.startDate === this.todayDate && this.endDate === this.todayDate;
  }

  isSingleDay(): boolean {
    return this.startDate === this.endDate;
  }

  get headingText(): string {
    if (this.isToday()) {
      return "Today's Reports";
    }
    if (this.isSingleDay()) {
      return `Reports for ${this.formatDisplayDate(this.startDate)}`;
    }
    return `Reports: ${this.formatDisplayDate(this.startDate)} → ${this.formatDisplayDate(this.endDate)}`;
  }

  get emptyMessage(): string {
    if (this.isToday()) {
      return 'There are no completed trips in the system today.';
    }
    if (this.isSingleDay()) {
      return `There are no completed trips in the system for ${this.formatDisplayDate(this.startDate)}.`;
    }
    return `There are no completed trips in the system between ${this.formatDisplayDate(this.startDate)} and ${this.formatDisplayDate(this.endDate)}.`;
  }

  calcularTotalHoras(): number {
    return this.relatorioState.calcularTotalHoras(this.viagens);
  }

  formatTotalHoras(): string {
    return this.relatorioState.formatHoursToHhMm(this.calcularTotalHoras());
  }

  calcularTotalKm(): number {
    return this.relatorioState.calcularTotalKm(this.viagens);
  }

  calcularTotalEuros(): number {
    return this.relatorioState.calcularTotalEuros(this.viagens);
  }

  async exportCsv(): Promise<void> {
    if (this.viagens.length === 0) return;

    const escapeCsv = (val: unknown): string => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatCsvAddress = async (raw: string): Promise<string> => {
      if (!raw) return '';
      if (!this.geolocationService.isCoordinateString(raw)) return raw;
      const resolved = await this.geolocationService.resolveDisplayAddress(raw);
      const [latStr, lonStr] = raw.split(',').map(p => p.trim());
      const lat = Number(latStr);
      const lon = Number(lonStr);
      const shortCoords = Number.isFinite(lat) && Number.isFinite(lon)
        ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        : raw;
      return resolved && resolved !== raw ? `${resolved} (${shortCoords})` : shortCoords;
    };

    const headers = [
      'Start Time',
      'End Time',
      'Duration',
      'Driver',
      'Taxi',
      'Client',
      'Pickup Address',
      'Destination Address',
      'Distance (Km)',
      'Passengers',
      'Price (EUR)'
    ];

    const rows = await Promise.all(this.viagens.map(async v => {
      const driver = this.relatorioState.getMotoristaForViagem(v);
      const taxi = this.relatorioState.getTaxiForViagem(v);
      const client = this.relatorioState.getClientForViagem(v);
      const duration = this.relatorioState.formatHoursToHhMm(this.relatorioState.getDurationHours(v));
      const [pickupAddr, destAddr] = await Promise.all([
        formatCsvAddress(v.entryAddress || ''),
        formatCsvAddress(v.exitAddress || '')
      ]);

      return [
        new Date(v.entryTime).toLocaleString('pt-PT'),
        new Date(v.exitTime).toLocaleString('pt-PT'),
        duration,
        driver ? `${driver.name} (${driver.NIF})` : '',
        taxi ? `${taxi.licensePlate} (${taxi.brand} ${taxi.model})` : '',
        client ? `${client.name} (${client.NIF})` : '',
        pickupAddr,
        destAddr,
        (v.distanceKm || 0).toFixed(2),
        v.numberOfPeople ?? 1,
        (v.price || 0).toFixed(2)
      ].map(escapeCsv).join(',');
    }));

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const fileName = this.isSingleDay()
      ? `taxi-reports_${this.startDate}.csv`
      : `taxi-reports_${this.startDate}_to_${this.endDate}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  setTrendMetric(metric: 'revenue' | 'trips' | 'kms'): void {
    this.trendMetric = metric;
  }

  setComfortMetric(metric: 'revenue' | 'trips'): void {
    this.comfortMetric = metric;
    this.recalculateComfortPcts();
  }

  setHoveredBucket(bucket: TrendBucket | null): void {
    this.hoveredBucket = bucket;
  }

  getBucketValue(bucket: TrendBucket): number {
    if (this.trendMetric === 'trips') return bucket.trips;
    if (this.trendMetric === 'kms') return bucket.kms;
    return bucket.revenue;
  }

  get maxTrendValue(): number {
    return this.trendBuckets.reduce((max, b) => Math.max(max, this.getBucketValue(b)), 0);
  }

  getBucketHeightPct(bucket: TrendBucket): number {
    const val = this.getBucketValue(bucket);
    const max = this.maxTrendValue;
    if (max <= 0 || val <= 0) return 0;
    return Math.max(6, Math.round((val / max) * 100));
  }

  formatBucketValue(bucket: TrendBucket): string {
    if (this.trendMetric === 'trips') {
      return `${bucket.trips} ${bucket.trips === 1 ? 'trip' : 'trips'}`;
    }
    if (this.trendMetric === 'kms') {
      return `${bucket.kms.toFixed(1)} km`;
    }
    return `€${bucket.revenue.toFixed(2)}`;
  }

  get basicDashLength(): number {
    return (this.basicStats.pct / 100) * this.donutCircumference;
  }

  get luxuryDashLength(): number {
    return (this.luxuryStats.pct / 100) * this.donutCircumference;
  }

  get comfortCenterTotal(): string {
    if (this.comfortMetric === 'trips') {
      const total = this.basicStats.trips + this.luxuryStats.trips;
      return `${total}`;
    }
    const totalRev = this.basicStats.revenue + this.luxuryStats.revenue;
    return `€${totalRev.toFixed(0)}`;
  }

  get comfortCenterSub(): string {
    return this.comfortMetric === 'trips' ? 'Trips' : 'Revenue';
  }

  private rebuildCharts(): void {
    this.hoveredBucket = null;
    this.buildTrendBuckets();
    this.buildComfortBreakdown();
    this.buildTopDrivers();
  }

  private buildTrendBuckets(): void {
    if (this.viagens.length === 0) {
      this.trendBuckets = [];
      return;
    }

    if (this.isSingleDay()) {
      const byHour = new Map<number, TrendBucket>();
      let minHour = 23;
      let maxHour = 0;

      for (const v of this.viagens) {
        const hour = new Date(v.entryTime).getHours();
        minHour = Math.min(minHour, hour);
        maxHour = Math.max(maxHour, hour);
        const existing = byHour.get(hour) || {
          key: String(hour),
          label: `${String(hour).padStart(2, '0')}h`,
          revenue: 0,
          trips: 0,
          kms: 0
        };
        existing.trips += 1;
        existing.revenue += Number(v.price || 0);
        existing.kms += Number(v.distanceKm || 0);
        byHour.set(hour, existing);
      }

      const startHour = Math.max(0, minHour - 1);
      const endHour = Math.min(23, maxHour + 1);
      const result: TrendBucket[] = [];
      for (let h = startHour; h <= endHour; h++) {
        const found = byHour.get(h);
        result.push(
          found
            ? {
                ...found,
                revenue: Number(found.revenue.toFixed(2)),
                kms: Number(found.kms.toFixed(2))
              }
            : {
                key: String(h),
                label: `${String(h).padStart(2, '0')}h`,
                revenue: 0,
                trips: 0,
                kms: 0
              }
        );
      }
      this.trendBuckets = result;
      return;
    }

    const byDay = new Map<string, TrendBucket>();
    for (const v of this.viagens) {
      const key = this.toIsoDate(new Date(v.entryTime));
      const parts = key.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : key;
      const existing = byDay.get(key) || {
        key,
        label,
        revenue: 0,
        trips: 0,
        kms: 0
      };
      existing.trips += 1;
      existing.revenue += Number(v.price || 0);
      existing.kms += Number(v.distanceKm || 0);
      byDay.set(key, existing);
    }

    const startParts = this.startDate.split('-').map(Number);
    const endParts = this.endDate.split('-').map(Number);
    if (startParts.length === 3 && endParts.length === 3) {
      const startObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const endObj = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      const diffDays = Math.round((endObj.getTime() - startObj.getTime()) / 86400000) + 1;

      if (diffDays > 0 && diffDays <= 31) {
        const result: TrendBucket[] = [];
        const cur = new Date(startObj);
        while (cur <= endObj) {
          const key = this.toIsoDate(cur);
          const d = String(cur.getDate()).padStart(2, '0');
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const found = byDay.get(key);
          result.push(
            found
              ? {
                  ...found,
                  revenue: Number(found.revenue.toFixed(2)),
                  kms: Number(found.kms.toFixed(2))
                }
              : {
                  key,
                  label: `${d}/${m}`,
                  revenue: 0,
                  trips: 0,
                  kms: 0
                }
          );
          cur.setDate(cur.getDate() + 1);
        }
        this.trendBuckets = result;
        return;
      }
    }

    this.trendBuckets = Array.from(byDay.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((b) => ({
        ...b,
        revenue: Number(b.revenue.toFixed(2)),
        kms: Number(b.kms.toFixed(2))
      }));
  }

  private buildComfortBreakdown(): void {
    let basicTrips = 0;
    let basicRevenue = 0;
    let luxuryTrips = 0;
    let luxuryRevenue = 0;

    for (const v of this.viagens) {
      const taxi = this.relatorioState.getTaxiForViagem(v);
      const price = Number(v.price || 0);
      if (taxi?.confort === 'Luxury') {
        luxuryTrips += 1;
        luxuryRevenue += price;
      } else if (taxi?.confort === 'Basic') {
        basicTrips += 1;
        basicRevenue += price;
      }
    }

    this.basicStats = {
      trips: basicTrips,
      revenue: Number(basicRevenue.toFixed(2)),
      pct: 0
    };
    this.luxuryStats = {
      trips: luxuryTrips,
      revenue: Number(luxuryRevenue.toFixed(2)),
      pct: 0
    };
    this.recalculateComfortPcts();
  }

  private recalculateComfortPcts(): void {
    if (this.comfortMetric === 'trips') {
      const total = this.basicStats.trips + this.luxuryStats.trips;
      this.basicStats.pct = total > 0 ? Number(((this.basicStats.trips / total) * 100).toFixed(1)) : 0;
      this.luxuryStats.pct = total > 0 ? Number(((this.luxuryStats.trips / total) * 100).toFixed(1)) : 0;
      return;
    }

    const totalRev = this.basicStats.revenue + this.luxuryStats.revenue;
    this.basicStats.pct = totalRev > 0 ? Number(((this.basicStats.revenue / totalRev) * 100).toFixed(1)) : 0;
    this.luxuryStats.pct = totalRev > 0 ? Number(((this.luxuryStats.revenue / totalRev) * 100).toFixed(1)) : 0;
  }

  private buildTopDrivers(): void {
    const map = new Map<
      string,
      { id: string; name: string; trips: number; revenue: number; ratingAverage: number; ratingCount: number }
    >();

    for (const v of this.viagens) {
      const drv = this.relatorioState.getMotoristaForViagem(v);
      const id = drv?._id ? String(drv._id) : this.relatorioState.extractDriverId(v);
      if (!id) continue;

      const cur = map.get(id) || {
        id,
        name: drv?.name || 'Driver',
        trips: 0,
        revenue: 0,
        ratingAverage: drv?.ratingAverage || 0,
        ratingCount: drv?.ratingCount || 0
      };
      cur.trips += 1;
      cur.revenue += Number(v.price || 0);
      map.set(id, cur);
    }

    const sorted = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue || b.trips - a.trips)
      .slice(0, 5);

    const maxRev = sorted.reduce((m, d) => Math.max(m, d.revenue), 0);
    this.topDrivers = sorted.map((d) => ({
      ...d,
      revenue: Number(d.revenue.toFixed(2)),
      widthPct: maxRev > 0 ? Math.max(6, Math.round((d.revenue / maxRev) * 100)) : 0
    }));
  }
}
