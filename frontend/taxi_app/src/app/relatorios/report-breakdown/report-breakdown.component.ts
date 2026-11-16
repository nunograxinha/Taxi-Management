import { Component, Input, OnInit } from '@angular/core';
import {
  DateRange,
  RelatorioStateService,
  ReportMetric,
  SubtotalGroup
} from '../../appServices/relatorio-state.service';
import { Viagem } from '../../viagem/viagem_interface';
import { Motorista } from '../../motoristas/motorista_interface';
import { Taxi } from '../../taxis/taxi_interface';
import { GeolocationService } from '../../appServices/geolocation.service';

@Component({
  selector: 'app-report-breakdown',
  templateUrl: './report-breakdown.component.html',
  styleUrls: ['./report-breakdown.component.css']
})
export class ReportBreakdownComponent implements OnInit {
  @Input() metric: ReportMetric = 'trips';

  activeTab: 'driver' | 'taxi' = 'driver';
  driverGroups: SubtotalGroup[] = [];
  taxiGroups: SubtotalGroup[] = [];
  allViagens: Viagem[] = [];
  dateRange: DateRange = { startDate: '', endDate: '' };

  expandedGroupId: string | null = null;
  selectedTrip: Viagem | null = null;
  selectedDriver: Motorista | null = null;
  selectedTaxi: Taxi | null = null;
  resolvedAddresses: Record<string, string> = {};

  constructor(
    private relatorioState: RelatorioStateService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    this.dateRange = this.relatorioState.getDateRange();
    this.relatorioState.getDateRange$().subscribe(range => {
      this.dateRange = range;
    });

    this.relatorioState.getViagensHoje$().subscribe(viagens => {
      this.allViagens = viagens;
      this.rebuildGroups();
    });
  }

  private rebuildGroups(): void {
    this.driverGroups = this.relatorioState.getSubtotalGroups(this.metric, 'driver', this.allViagens);
    this.taxiGroups = this.relatorioState.getSubtotalGroups(this.metric, 'taxi', this.allViagens);
    this.resolveTripAddresses(this.allViagens);
  }

  formatAddress(raw: string): string {
    if (!raw) return '';
    if (!this.geolocationService.isCoordinateString(raw)) {
      return raw;
    }

    const [latStr, lonStr] = raw.split(',').map(p => p.trim());
    const lat = Number(latStr);
    const lon = Number(lonStr);
    const shortCoords = Number.isFinite(lat) && Number.isFinite(lon)
      ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      : raw;

    const resolved = this.resolvedAddresses[raw];
    return resolved ? `${resolved} (${shortCoords})` : shortCoords;
  }

  private resolveTripAddresses(trips: Viagem[]): void {
    const rawSet = new Set<string>();
    trips.forEach(t => {
      if (t.entryAddress) rawSet.add(t.entryAddress);
      if (t.exitAddress) rawSet.add(t.exitAddress);
    });

    rawSet.forEach(raw => {
      if (this.geolocationService.isCoordinateString(raw) && !this.resolvedAddresses[raw]) {
        this.geolocationService.resolveDisplayAddress(raw).then(resolved => {
          this.resolvedAddresses[raw] = resolved;
        });
      }
    });
  }

  get currentGroups(): SubtotalGroup[] {
    return this.activeTab === 'driver' ? this.driverGroups : this.taxiGroups;
  }

  get pageTitle(): string {
    if (this.metric === 'hours') return 'Total Hours Breakdown';
    if (this.metric === 'kms') return 'Total Kilometers Breakdown';
    return 'Total Trips Breakdown';
  }

  get totalSummaryLabel(): string {
    if (this.metric === 'hours') {
      return `${this.relatorioState.calcularTotalHoras(this.allViagens)} h`;
    }
    if (this.metric === 'kms') {
      return `${this.relatorioState.calcularTotalKm(this.allViagens)} Km`;
    }
    return `${this.allViagens.length} ${this.allViagens.length === 1 ? 'trip' : 'trips'}`;
  }

  get periodLabel(): string {
    const today = this.relatorioState.getTodayDateString();
    if (this.dateRange.startDate === today && this.dateRange.endDate === today) {
      return `Today (${this.formatDisplayDate(today)})`;
    }
    if (this.dateRange.startDate === this.dateRange.endDate) {
      return this.formatDisplayDate(this.dateRange.startDate);
    }
    return `${this.formatDisplayDate(this.dateRange.startDate)} → ${this.formatDisplayDate(this.dateRange.endDate)}`;
  }

  setTab(tab: 'driver' | 'taxi'): void {
    this.activeTab = tab;
    this.expandedGroupId = null;
  }

  toggleGroup(groupId: string): void {
    this.expandedGroupId = this.expandedGroupId === groupId ? null : groupId;
  }

  formatSubtotal(value: number): string {
    if (this.metric === 'hours') return `${value} h`;
    if (this.metric === 'kms') return `${value} Km`;
    return `${value} ${value === 1 ? 'trip' : 'trips'}`;
  }

  formatTripMetric(viagem: Viagem): string {
    if (this.metric === 'hours') {
      return `${this.relatorioState.getDurationHours(viagem)} h`;
    }
    if (this.metric === 'kms') {
      return `${parseFloat((viagem.distanceKm || 0).toFixed(2))} Km`;
    }
    return this.formatTripTimeRange(viagem.entryTime, viagem.exitTime);
  }

  formatTripTimeRange(entryTime: Date | string, exitTime: Date | string): string {
    const start = new Date(entryTime);
    const end = new Date(exitTime);
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    return sameDay
      ? `${this.formatDateTime(start)} → ${this.formatTime(end)}`
      : `${this.formatDateTime(start)} → ${this.formatDateTime(end)}`;
  }

  getDriverForTrip(viagem: Viagem): Motorista | undefined {
    return this.relatorioState.getMotoristaForViagem(viagem);
  }

  getTaxiForTrip(viagem: Viagem): Taxi | undefined {
    return this.relatorioState.getTaxiForViagem(viagem);
  }

  getTripDuration(viagem: Viagem): number {
    return this.relatorioState.getDurationHours(viagem);
  }

  openGroupDetails(event: Event, group: SubtotalGroup): void {
    event.stopPropagation();
    if (group.driver) {
      this.openDriverModal(group.driver);
    } else if (group.taxi) {
      this.openTaxiModal(group.taxi);
    }
  }

  openTripModal(viagem: Viagem): void {
    this.selectedDriver = null;
    this.selectedTaxi = null;
    this.selectedTrip = viagem;
  }

  openDriverModal(driver: Motorista | undefined): void {
    if (!driver) return;
    this.selectedTrip = null;
    this.selectedTaxi = null;
    this.selectedDriver = driver;
  }

  openTaxiModal(taxi: Taxi | undefined): void {
    if (!taxi) return;
    this.selectedTrip = null;
    this.selectedDriver = null;
    this.selectedTaxi = taxi;
  }

  closeModals(): void {
    this.selectedTrip = null;
    this.selectedDriver = null;
    this.selectedTaxi = null;
  }

  formatDateTime(dateInput: Date | string): string {
    const d = new Date(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year} ${this.formatTime(d)}`;
  }

  formatTime(dateInput: Date | string): string {
    const d = new Date(dateInput);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
}
