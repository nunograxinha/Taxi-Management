import { Component, OnInit } from '@angular/core';
import { RelatorioStateService } from '../../appServices/report-state.service';
import { Viagem } from '../../trips/trip.interface';

@Component({
  selector: 'app-relatorios-page',
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.css']
})
export class RelatoriosPageComponent implements OnInit {
  viagens: Viagem[] = [];
  startDate: string = '';
  endDate: string = '';
  todayDate: string = '';

  constructor(private relatorioState: RelatorioStateService) {}

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
