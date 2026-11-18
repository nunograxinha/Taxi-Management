import { Component, OnInit } from '@angular/core';
import { ReportStateService } from '../../appServices/report-state.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { Trip } from '../../trips/trip.interface';

@Component({
  selector: 'app-relatorios-page',
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.css']
})
export class ReportsPageComponent implements OnInit {
  viagens: Trip[] = [];
  startDate: string = '';
  endDate: string = '';
  todayDate: string = '';

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

    this.relatorioState.getDateRange$().subscribe(range => {
      this.startDate = range.startDate;
      this.endDate = range.endDate;
    });

    this.relatorioState.getViagensHoje$().subscribe(viagensArray => {
      this.viagens = viagensArray;
    });
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
}
