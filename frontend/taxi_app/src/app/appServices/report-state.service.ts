import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, Observable, of } from 'rxjs';
import { Viagem } from '../trips/trip.interface';
import { ViagemService } from '../appServices/trip.service';
import { Motorista } from '../drivers/driver.interface';
import { MotoristaService } from './driver.service';
import { Taxi } from '../taxis/taxi.interface';
import { TaxiService } from './taxi.service';
import { Turno } from '../shifts/shift.interface';
import { TurnoService } from './shift.service';
import { Cliente } from '../client/client.interface';
import { ClienteService } from './client.service';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export type ReportMetric = 'trips' | 'hours' | 'kms' | 'revenue';

export interface SubtotalGroup {
  id: string;
  label: string;
  sublabel?: string;
  driver?: Motorista;
  taxi?: Taxi;
  client?: Cliente;
  viagens: Viagem[];
  subtotalValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class RelatorioStateService {
  private _todasViagens: Viagem[] = [];
  private _dateRange$: BehaviorSubject<DateRange>;
  private _viagensHoje$: BehaviorSubject<Viagem[]> = new BehaviorSubject<Viagem[]>([]);
  private _viagensPorMotoristaHoje$: BehaviorSubject<Map<string, Viagem[]>> = new BehaviorSubject(new Map());
  private _motoristasMap: Map<string, Motorista> = new Map();
  private _taxisMap: Map<string, Taxi> = new Map();
  private _turnosMap: Map<string, Turno> = new Map();
  private _clientesMap: Map<string, Cliente> = new Map();

  constructor(
    private viagemService: ViagemService,
    private motoristaService: MotoristaService,
    private taxiService: TaxiService,
    private turnoService: TurnoService,
    private clienteService: ClienteService
  ) {
    const today = this.getTodayDateString();
    this._dateRange$ = new BehaviorSubject<DateRange>({ startDate: today, endDate: today });
    this.atualizarViagens();
  }

  getTodayDateString(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  getDateRange(): DateRange {
    return this._dateRange$.getValue();
  }

  getDateRange$(): Observable<DateRange> {
    return this._dateRange$.asObservable();
  }

  isTodaySelected(): boolean {
    const today = this.getTodayDateString();
    const { startDate, endDate } = this._dateRange$.getValue();
    return startDate === today && endDate === today;
  }

  setDateRange(startDate: string, endDate: string): void {
    const today = this.getTodayDateString();
    let start = startDate || today;
    let end = endDate || start;
    if (start > end) {
      end = start;
    }
    const range = { startDate: start, endDate: end };
    this._dateRange$.next(range);
    this.aplicarFiltroPeriodo(range);
  }

  setSelectedDate(dateStr: string): void {
    const target = dateStr || this.getTodayDateString();
    this.setDateRange(target, target);
  }

  atualizarViagens(): void {
    forkJoin({
      motoristas: this.motoristaService.obterMotoristas().pipe(catchError(() => of([] as Motorista[]))),
      taxis: this.taxiService.getTaxis().pipe(catchError(() => of([] as Taxi[]))),
      turnos: this.turnoService.getTurnos().pipe(catchError(() => of([] as Turno[]))),
      clientes: this.clienteService.getClients().pipe(catchError(() => of([] as Cliente[]))),
      viagens: this.viagemService.listarTodasViagens().pipe(catchError(() => of([] as Viagem[])))
    }).subscribe({
      next: ({ motoristas, taxis, turnos, clientes, viagens }) => {
        this._motoristasMap.clear();
        motoristas.forEach(m => {
          if (m._id) this._motoristasMap.set(m._id, m);
        });

        this._taxisMap.clear();
        taxis.forEach(t => {
          if (t._id) this._taxisMap.set(t._id, t);
        });

        this._turnosMap.clear();
        turnos.forEach(tr => {
          if (tr._id) this._turnosMap.set(tr._id, tr);
        });

        this._clientesMap.clear();
        clientes.forEach(c => {
          if (c._id) this._clientesMap.set(c._id, c);
        });

        this._todasViagens = viagens;
        this.aplicarFiltroPeriodo(this._dateRange$.getValue());
      },
      error: (err) => {
        console.error('Error updating report data:', err);
      }
    });
  }

  private aplicarFiltroPeriodo(range: DateRange): void {
    const viagensFiltradas = this.filtrarViagensPorPeriodo(this._todasViagens, range);
    this._viagensHoje$.next(viagensFiltradas);
    this._viagensPorMotoristaHoje$.next(this.gerarMapa(viagensFiltradas));
  }

  private filtrarViagensPorPeriodo(viagens: Viagem[], range: DateRange): Viagem[] {
    const [sYear, sMonth, sDay] = range.startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = range.endDate.split('-').map(Number);
    if (!sYear || !sMonth || !sDay || !eYear || !eMonth || !eDay) {
      return [];
    }

    const startMs = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0).getTime();
    const endMs = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999).getTime();

    return viagens.filter(v => {
      const entryMs = new Date(v.entryTime).getTime();
      return entryMs >= startMs && entryMs <= endMs;
    });
  }

  private gerarMapa(viagens: Viagem[]): Map<string, Viagem[]> {
    const mapa = new Map<string, Viagem[]>();
    for (const viagem of viagens) {
      const driverId = this.extractDriverId(viagem);
      if (!driverId) continue;
      const lista = mapa.get(driverId) || [];
      lista.push(viagem);
      mapa.set(driverId, lista);
    }
    return mapa;
  }

  extractDriverId(viagem: Viagem): string {
    if (!viagem.driver) return '';
    return typeof viagem.driver === 'object' ? (viagem.driver as any)._id || '' : String(viagem.driver);
  }

  extractTaxiId(viagem: Viagem): string {
    if (!viagem.shift) return '';
    if (typeof viagem.shift === 'object') {
      const shiftObj = viagem.shift as any;
      if (shiftObj.taxi) {
        return typeof shiftObj.taxi === 'object' ? shiftObj.taxi._id || '' : String(shiftObj.taxi);
      }
      if (shiftObj._id) {
        const turno = this._turnosMap.get(shiftObj._id);
        if (turno?.taxi) {
          return typeof turno.taxi === 'object' ? (turno.taxi as any)._id || '' : String(turno.taxi);
        }
      }
      return '';
    }
    const turno = this._turnosMap.get(String(viagem.shift));
    if (!turno?.taxi) return '';
    return typeof turno.taxi === 'object' ? (turno.taxi as any)._id || '' : String(turno.taxi);
  }

  getViagensHoje$(): Observable<Viagem[]> {
    return this._viagensHoje$.asObservable();
  }

  getViagensPorMotoristaHoje$(): Observable<Map<string, Viagem[]>> {
    return this._viagensPorMotoristaHoje$.asObservable();
  }

  getMotorista(id: string): Motorista | undefined {
    return this._motoristasMap.get(id);
  }

  getTaxi(id: string): Taxi | undefined {
    return this._taxisMap.get(id);
  }

  getMotoristaForViagem(viagem: Viagem): Motorista | undefined {
    if (typeof viagem.driver === 'object' && viagem.driver !== null && (viagem.driver as any).name) {
      return viagem.driver as Motorista;
    }
    return this._motoristasMap.get(this.extractDriverId(viagem));
  }

  getTaxiForViagem(viagem: Viagem): Taxi | undefined {
    const taxiId = this.extractTaxiId(viagem);
    return taxiId ? this._taxisMap.get(taxiId) : undefined;
  }

  extractClientId(viagem: Viagem): string {
    if (!viagem.client) return '';
    return typeof viagem.client === 'object' ? (viagem.client as any)._id || '' : String(viagem.client);
  }

  getClientForViagem(viagem: Viagem): Cliente | undefined {
    if (typeof viagem.client === 'object' && viagem.client !== null && (viagem.client as any).name) {
      return viagem.client as Cliente;
    }
    return this._clientesMap.get(this.extractClientId(viagem));
  }

  getDurationHours(viagem: Viagem): number {
    const entrada = new Date(viagem.entryTime).getTime();
    const saida = new Date(viagem.exitTime).getTime();
    const horas = Math.max(0, (saida - entrada) / (1000 * 60 * 60));
    return parseFloat(horas.toFixed(4));
  }

  formatHoursToHhMm(hoursDecimal: number): string {
    const totalMinutes = Math.max(0, Math.round((hoursDecimal || 0) * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  }

  calcularTotalHoras(viagens: Viagem[]): number {
    let totalMs = 0;
    for (const viagem of viagens) {
      const entrada = new Date(viagem.entryTime).getTime();
      const saida = new Date(viagem.exitTime).getTime();
      totalMs += Math.max(0, saida - entrada);
    }
    const totalHoras = totalMs / (1000 * 60 * 60);
    return parseFloat(totalHoras.toFixed(2));
  }

  calcularTotalKm(viagens: Viagem[]): number {
    const totalKm = viagens.reduce((soma, viagem) => soma + (viagem.distanceKm || 0), 0);
    return parseFloat(totalKm.toFixed(2));
  }

  calcularTotalEuros(viagens: Viagem[]): number {
    const totalEuros = viagens.reduce((soma, viagem) => soma + (viagem.price || 0), 0);
    return parseFloat(totalEuros.toFixed(2));
  }

  getSubtotalGroups(metric: ReportMetric, groupBy: 'driver' | 'taxi' | 'client', viagens: Viagem[]): SubtotalGroup[] {
    const groupsMap = new Map<string, SubtotalGroup>();

    for (const viagem of viagens) {
      if (groupBy === 'driver') {
        const driver = this.getMotoristaForViagem(viagem);
        const id = driver?._id || this.extractDriverId(viagem) || 'unknown-driver';
        const existing = groupsMap.get(id);
        if (existing) {
          existing.viagens.push(viagem);
        } else {
          groupsMap.set(id, {
            id,
            label: driver ? driver.name : 'Unknown Driver',
            sublabel: driver ? `NIF: ${driver.NIF}` : undefined,
            driver,
            viagens: [viagem],
            subtotalValue: 0
          });
        }
      } else if (groupBy === 'taxi') {
        const taxi = this.getTaxiForViagem(viagem);
        const id = taxi?._id || this.extractTaxiId(viagem) || 'unknown-taxi';
        const existing = groupsMap.get(id);
        if (existing) {
          existing.viagens.push(viagem);
        } else {
          groupsMap.set(id, {
            id,
            label: taxi ? taxi.licensePlate : 'Unknown Taxi',
            sublabel: taxi ? `${taxi.brand} ${taxi.model} · ${taxi.confort}` : undefined,
            taxi,
            viagens: [viagem],
            subtotalValue: 0
          });
        }
      } else {
        const client = this.getClientForViagem(viagem);
        const id = client?._id || this.extractClientId(viagem) || 'unknown-client';
        const existing = groupsMap.get(id);
        if (existing) {
          existing.viagens.push(viagem);
        } else {
          groupsMap.set(id, {
            id,
            label: client ? client.name : 'Unknown Client',
            sublabel: client ? `NIF: ${client.NIF}` : undefined,
            client,
            viagens: [viagem],
            subtotalValue: 0
          });
        }
      }
    }

    const groups = Array.from(groupsMap.values()).map(group => {
      const sortedTrips = [...group.viagens].sort((a, b) => {
        if (metric === 'hours') {
          return this.getDurationHours(b) - this.getDurationHours(a);
        }
        if (metric === 'kms') {
          return (b.distanceKm || 0) - (a.distanceKm || 0);
        }
        if (metric === 'revenue') {
          return (b.price || 0) - (a.price || 0);
        }
        // 'trips': most recent to oldest
        return new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime();
      });

      let subtotalValue = 0;
      if (metric === 'trips') {
        subtotalValue = sortedTrips.length;
      } else if (metric === 'hours') {
        subtotalValue = this.calcularTotalHoras(sortedTrips);
      } else if (metric === 'revenue') {
        subtotalValue = this.calcularTotalEuros(sortedTrips);
      } else {
        subtotalValue = this.calcularTotalKm(sortedTrips);
      }

      return {
        ...group,
        viagens: sortedTrips,
        subtotalValue
      };
    });

    // Sort groups descending by subtotalValue (US12 b)
    return groups.sort((a, b) => b.subtotalValue - a.subtotalValue);
  }
}
