import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DriverService } from '../../appServices/driver.service';
import { ShiftService } from '../../appServices/shift.service';
import { TripService } from '../../appServices/trip.service';
import { Driver } from '../../drivers/driver.interface';
import { Trip } from '../../trips/trip.interface';
import { Shift } from '../shift.interface';
import { TaxiService } from '../../appServices/taxi.service';
import { Taxi } from '../../taxis/taxi.interface';
import { ClientService } from '../../appServices/client.service';
import { Client } from '../../client/client.interface';
import { GeolocationService } from '../../appServices/geolocation.service';
import { RideRequestService } from '../../appServices/ride-request.service';
import { SocketService } from '../../appServices/socket.service';
import { RideRequest } from '../../client/ride-request.interface';
import { getTaxiCarImage } from '../../appServices/taxi-icon.util';

@Component({
  selector: 'app-ver-turno',
  templateUrl: './shift-detail.component.html',
  styleUrls: ['./shift-detail.component.css']
})
export class ShiftDetailComponent implements OnInit, OnDestroy {
  motorista?: Driver;
  turnos: Shift[] = [];
  viagens: Trip[] = [];
  turnoAtual: Shift | undefined;
  viagensDoTurnoAtual: Trip[] = [];
  semTurnos: boolean = false;
  loading: boolean = true;
  compatiblePendingCount: number = 0;
  private allRequests: RideRequest[] = [];
  private subscription?: Subscription;
  private socketSub = new Subscription();

  constructor(
    private motoristaService: DriverService,
    private turnoService: ShiftService,
    private viagemService: TripService,
    private taxiService: TaxiService,
    private clienteService: ClientService,
    private geolocationService: GeolocationService,
    private pedidoViagemService: RideRequestService,
    private socketService: SocketService,
  ) {}

  ngOnInit() {
    const refreshCounter = () => {
      if (this.turnoAtual) {
        this.loadRideRequestsForCounter();
      }
    };
    this.socketSub.add(this.socketService.onEvent('pedido:created').subscribe(refreshCounter));
    this.socketSub.add(this.socketService.onEvent('pedido:updated').subscribe(refreshCounter));
    this.socketSub.add(this.socketService.onEvent('pedido:deleted').subscribe(refreshCounter));
    this.socketSub.add(this.socketService.onEvent('pedido:clientRejected').subscribe(refreshCounter));

    this.subscription = this.motoristaService.driver$.subscribe((m) => {
      if (m) {
        this.motorista = m;

        this.turnoService.getShiftsByDriverNIF(m.NIF!).subscribe({
          next: (turnos) => {
            this.turnos = turnos;
            console.log('Driver shifts:', this.turnos);
        
            this.semTurnos = this.turnos.length === 0;
        
            this.turnoAtual = this.getTurnoAtual();
            this.atualizarViagensDoTurnoAtual();
            if (this.turnoAtual) {
              this.getTaxi(this.turnoAtual.taxi);
              this.loadRideRequestsForCounter();
            } else {
              this.compatiblePendingCount = 0;
            }
            this.loading = false;
            console.log(this.turnoAtual);
          },
          error: (err) => {
            this.loading = false;
            console.error('Error fetching shifts:', err);
          }
        });

        this.viagemService.getTripsByDriver(m._id!).subscribe({
          next: (viagens) => {
          this.viagens = viagens.sort((a, b) =>
            new Date(b.entryTime!).getTime() - new Date(a.entryTime!).getTime()
          );
          this.atualizarViagensDoTurnoAtual();
          },
          error: (err) => {
            console.error('Error fetching trips:', err);
          }
        });
      }
    });
  }

  private atualizarViagensDoTurnoAtual() {
    if (this.turnoAtual) {
      this.viagensDoTurnoAtual = this.viagens.filter(
        v => v.shift === this.turnoAtual!._id
      );
      this.resolveTripAddresses(this.viagensDoTurnoAtual);
    } else {
      this.viagensDoTurnoAtual = [];
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.socketSub.unsubscribe();
  }

  getTurnoAtual(): Shift | undefined {
    const agora = new Date();
    console.log('Current date:', agora.toISOString());
  
    for (const turno of this.turnos) {
      const inicio = new Date(turno.start);
      const fim = new Date(turno.end);
      console.log(`Shift: ${inicio.toISOString()} to ${fim.toISOString()}`);
  
      if (agora >= inicio && agora <= fim) {
        console.log('Current shift found:', turno);
        return turno;
      }
    }
  
    console.log('No current shift found.');
    return undefined;
  }

  taxiInfoMap = new Map<string, string>();
  taxiMap = new Map<string, Taxi>();
  resolvedAddresses: { [raw: string]: string } = {};

  getTaxiInfo(taxiId: string): string {
    if (this.taxiInfoMap.has(taxiId)) {
      return this.taxiInfoMap.get(taxiId)!;
    } else {
      this.taxiInfoMap.set(taxiId, 'Loading...');
      this.taxiService.getTaxiById(taxiId).subscribe({
        next: (taxi) => {
          if (taxi) {
            this.taxiMap.set(taxiId, taxi);
            this.updateCompatiblePendingCount();
          }
          const info = taxi ? taxi.licensePlate : 'Taxi not found';
          this.taxiInfoMap.set(taxiId, info);
        },
        error: () => {
          this.taxiInfoMap.set(taxiId, 'Taxi not found');
        }
      });
      return 'Loading...';
    }
  }

  getTaxi(taxiId: string): Taxi | undefined {
    if (!this.taxiInfoMap.has(taxiId)) {
      this.getTaxiInfo(taxiId);
    }
    return this.taxiMap.get(taxiId);
  }

  getTaxiImage(taxi: Taxi): string {
    return getTaxiCarImage(taxi.brand, taxi.model);
  }

  getTotalTurno(): number {
    return this.viagensDoTurnoAtual.reduce((acc, v) => acc + (v.price || 0), 0);
  }

  formatTimeOnly(date: string | Date): string {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  formatAddress(raw: string): string {
    return this.resolvedAddresses[raw] || raw;
  }

  private resolveTripAddresses(trips: Trip[]): void {
    const rawSet = new Set<string>();
    trips.forEach((t) => {
      if (t.entryAddress && !t.entryAddressLabel) rawSet.add(t.entryAddress);
      if (t.exitAddress && !t.exitAddressLabel) rawSet.add(t.exitAddress);
    });

    rawSet.forEach((raw) => {
      if (this.geolocationService.isCoordinateString(raw) && !this.resolvedAddresses[raw]) {
        this.geolocationService.resolveDisplayAddress(raw).then((resolved) => {
          this.resolvedAddresses[raw] = resolved;
        });
      }
    });
  }


  loadRideRequestsForCounter(): void {
    if (!this.turnoAtual) {
      this.compatiblePendingCount = 0;
      return;
    }
    this.pedidoViagemService.getRideRequests().subscribe({
      next: (requests) => {
        this.allRequests = requests || [];
        this.updateCompatiblePendingCount();
      },
      error: () => {}
    });
  }

  updateCompatiblePendingCount(): void {
    if (!this.turnoAtual) {
      this.compatiblePendingCount = 0;
      return;
    }
    const taxi = this.taxiMap.get(this.turnoAtual.taxi);
    if (!taxi) {
      return;
    }
    const driverId = this.motorista?._id ? String(this.motorista._id) : null;
    const capacity = Number(taxi.passengerCapacity) || 4;
    this.compatiblePendingCount = this.allRequests.filter((r) => {
      if (r.driverId) return false;
      if (driverId && Array.isArray(r.rejectedDrivers) && r.rejectedDrivers.map(String).includes(driverId)) {
        return false;
      }
      if (r.confort !== taxi.confort) return false;
      return (Number(r.numberOfPeople) || 1) <= capacity;
    }).length;
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

}
