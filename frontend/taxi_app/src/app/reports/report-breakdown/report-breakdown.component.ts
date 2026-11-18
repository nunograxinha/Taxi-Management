import { Component, Input, OnInit } from '@angular/core';
import {
  DateRange,
  ReportStateService,
  ReportMetric,
  SubtotalGroup
} from '../../appServices/report-state.service';
import { Trip } from '../../trips/trip.interface';
import { Driver } from '../../drivers/driver.interface';
import { Taxi } from '../../taxis/taxi.interface';
import { Client } from '../../client/client.interface';
import { GeolocationService } from '../../appServices/geolocation.service';
import { getTaxiCarImage } from '../../appServices/taxi-icon.util';

@Component({
  selector: 'app-report-breakdown',
  templateUrl: './report-breakdown.component.html',
  styleUrls: ['./report-breakdown.component.css']
})
export class ReportBreakdownComponent implements OnInit {
  @Input() metric: ReportMetric = 'trips';

  activeTab: 'driver' | 'taxi' | 'client' = 'driver';
  driverGroups: SubtotalGroup[] = [];
  taxiGroups: SubtotalGroup[] = [];
  clientGroups: SubtotalGroup[] = [];
  allViagens: Trip[] = [];
  dateRange: DateRange = { startDate: '', endDate: '' };

  expandedGroupId: string | null = null;
  selectedTrip: Trip | null = null;
  selectedDriver: Driver | null = null;
  selectedTaxi: Taxi | null = null;
  selectedClient: Client | null = null;
  resolvedAddresses: Record<string, string> = {};

  constructor(
    private relatorioState: ReportStateService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.metric === 'revenue' ? 'client' : 'driver';
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
    this.clientGroups = this.relatorioState.getSubtotalGroups(this.metric, 'client', this.allViagens);
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

  private resolveTripAddresses(trips: Trip[]): void {
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
    if (this.activeTab === 'client') return this.clientGroups;
    return this.activeTab === 'driver' ? this.driverGroups : this.taxiGroups;
  }

  get pageTitle(): string {
    if (this.metric === 'hours') return 'Total Hours Breakdown';
    if (this.metric === 'kms') return 'Total Kilometers Breakdown';
    if (this.metric === 'revenue') return 'Total Revenue Breakdown';
    return 'Total Trips Breakdown';
  }

  get totalSummaryLabel(): string {
    if (this.metric === 'hours') {
      return this.relatorioState.formatHoursToHhMm(this.relatorioState.calcularTotalHoras(this.allViagens));
    }
    if (this.metric === 'kms') {
      return `${this.relatorioState.calcularTotalKm(this.allViagens)} Km`;
    }
    if (this.metric === 'revenue') {
      return `€${this.relatorioState.calcularTotalEuros(this.allViagens).toFixed(2)}`;
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

  setTab(tab: 'driver' | 'taxi' | 'client'): void {
    this.activeTab = tab;
    this.expandedGroupId = null;
  }

  toggleGroup(groupId: string): void {
    this.expandedGroupId = this.expandedGroupId === groupId ? null : groupId;
  }

  formatSubtotal(value: number): string {
    if (this.metric === 'hours') return this.relatorioState.formatHoursToHhMm(value);
    if (this.metric === 'kms') return `${value} Km`;
    if (this.metric === 'revenue') return `€${value.toFixed(2)}`;
    return `${value} ${value === 1 ? 'trip' : 'trips'}`;
  }

  formatTripMetric(viagem: Trip): string {
    if (this.metric === 'hours') {
      return this.relatorioState.formatHoursToHhMm(this.relatorioState.getDurationHours(viagem));
    }
    if (this.metric === 'kms') {
      return `${parseFloat((viagem.distanceKm || 0).toFixed(2))} Km`;
    }
    if (this.metric === 'revenue') {
      return `€${(viagem.price || 0).toFixed(2)}`;
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

  getDriverForTrip(viagem: Trip): Driver | undefined {
    return this.relatorioState.getMotoristaForViagem(viagem);
  }

  getTaxiForTrip(viagem: Trip): Taxi | undefined {
    return this.relatorioState.getTaxiForViagem(viagem);
  }

  getClientForTrip(viagem: Trip): Client | undefined {
    return this.relatorioState.getClientForViagem(viagem);
  }

  getTripDuration(viagem: Trip): string {
    return this.relatorioState.formatHoursToHhMm(this.relatorioState.getDurationHours(viagem));
  }

  openGroupDetails(event: Event, group: SubtotalGroup): void {
    event.stopPropagation();
    if (group.driver) {
      this.openDriverModal(group.driver);
    } else if (group.taxi) {
      this.openTaxiModal(group.taxi);
    } else if (group.client) {
      this.openClientModal(group.client);
    }
  }

  openTripModal(viagem: Trip): void {
    this.selectedDriver = null;
    this.selectedTaxi = null;
    this.selectedClient = null;
    this.selectedTrip = viagem;
  }

  openDriverModal(driver: Driver | undefined): void {
    if (!driver) return;
    this.selectedTrip = null;
    this.selectedTaxi = null;
    this.selectedClient = null;
    this.selectedDriver = driver;
  }

  openTaxiModal(taxi: Taxi | undefined): void {
    if (!taxi) return;
    this.selectedTrip = null;
    this.selectedDriver = null;
    this.selectedClient = null;
    this.selectedTaxi = taxi;
  }

  openClientModal(client: Client | undefined): void {
    if (!client) return;
    this.selectedTrip = null;
    this.selectedDriver = null;
    this.selectedTaxi = null;
    this.selectedClient = client;
  }

  closeModals(): void {
    this.selectedTrip = null;
    this.selectedDriver = null;
    this.selectedTaxi = null;
    this.selectedClient = null;
  }

  getTaxiImage(taxi: Taxi): string {
    return getTaxiCarImage(taxi.brand, taxi.model);
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
