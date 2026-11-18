import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as L from 'leaflet';
import { firstValueFrom, Subscription } from 'rxjs';
import { ClientService } from '../../appServices/client.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { DriverService } from '../../appServices/driver.service';
import { RideRequestService } from '../../appServices/ride-request.service';
import { PriceService } from '../../appServices/price.service';
import { TaxiService } from '../../appServices/taxi.service';
import { ShiftService } from '../../appServices/shift.service';
import { TripService } from '../../appServices/trip.service';
import { SocketService } from '../../appServices/socket.service';
import { RideRequest } from '../../client/ride-request.interface';
import { Price } from '../../manage-prices/price.interface';
import { Shift } from '../../shifts/shift.interface';
import { Trip } from '../../trips/trip.interface';

@Component({
  selector: 'app-pedido-aceito',
  templateUrl: './accepted-request.component.html',
  styleUrls: ['./accepted-request.component.css']
})
export class AcceptedRequestComponent implements OnInit, OnDestroy {
  pedido: RideRequest  | null = null;
  pedidoId: string = '';
  startTimeLocal: string | null = null;
  endTimeLocal: string | null = null;
  precoFinal: number | null = null;
  preco: Price | null = null;
  bloquearBotoes: boolean = false;
  isStartingTrip: boolean = false;
  isEndingTrip: boolean = false;
  duracaoViagem: number | null = null;
  nomeCliente: string ='';
  startLocal: string = '';
  endLocal: string = '';
  requestedDestination: string = '';
  pickupCoords: [number, number] | null = null;
  destCoords: [number, number] | null = null;
  googleMapsUrl: string = '';
  followGps: boolean = true;
  routeDistanceLabel: string = '';
  routeDurationLabel: string = '';
  routeSteps: { instruction: string; distanceText: string; icon: string }[] = [];
  showAllSteps: boolean = false;
  private routeMap: L.Map | null = null;
  private carMarker: L.Marker | null = null;
  private approachOuterLine: L.Polyline | null = null;
  private approachInnerLine: L.Polyline | null = null;
  private tripOuterLine: L.Polyline | null = null;
  private watchId: number | null = null;
  private lastCarPos: [number, number] | null = null;
  private lastGpsPos: { latitude: string; longitude: string } | null = null;
  private lastGpsAt: number = 0;
  private routeBounds: L.LatLngBounds | null = null;
  private currentBearing: number = 0;
  private socketSub = new Subscription();
  private isCompletingTrip = false;
  private checkCancelledIntervalId: any = null;
  numPessoas: number = 1;
  numPessoasConfirmado: boolean = false;

  constructor(
    private pedidoViagemService: RideRequestService,
    private route: ActivatedRoute,
    private precoService: PriceService,
    private taxiService: TaxiService,
    private viagemService: TripService,
    private turnoService: ShiftService,
    private motoristaService: DriverService,
    private router: Router,
    private geolocationService: GeolocationService,
    private clienteService: ClientService,
    private snackBar: MatSnackBar,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      console.error('Request ID not provided');
      return;
    }
    this.pedidoId = pedidoId;
    this.socketService.joinPedido(pedidoId);

    this.socketSub.add(
      this.socketService.onEvent<{ id: string }>('pedido:deleted').subscribe((ev) => {
        if (ev && String(ev.id) === String(this.pedidoId)) {
          this.handleRideCancelledByClient();
        }
      })
    );

    this.socketSub.add(
      this.socketService.onEvent<RideRequest>('pedido:clientRejected').subscribe((ev) => {
        if (ev && String(ev._id) === String(this.pedidoId)) {
          this.handleRideCancelledByClient();
        }
      })
    );

    this.checkCancelledIntervalId = setInterval(() => {
      if (this.startTimeLocal || this.endTimeLocal || this.isCompletingTrip) {
        if (this.startTimeLocal || this.endTimeLocal) {
          this.stopCheckCancelledInterval();
        }
        return;
      }
      this.pedidoViagemService.getRideRequestById(this.pedidoId).subscribe({
        next: (res) => {
          if (!res || !res.driverId) {
            this.handleRideCancelledByClient();
          }
        },
        error: () => {
          this.handleRideCancelledByClient();
        }
      });
    }, 4000);

    this.geolocationService.getCurrentPosition().subscribe({
      next: (pos) => {
        this.lastGpsPos = pos;
        this.lastGpsAt = Date.now();
        this.socketService.emitDriverLocation({
          pedidoId: this.pedidoId,
          lat: Number(pos.latitude),
          lon: Number(pos.longitude),
          heading: this.currentBearing
        });
        if (this.routeMap && !this.startTimeLocal) {
          void this.drawApproachRouteFromGps(Number(pos.latitude), Number(pos.longitude), !this.followGps);
        }
      },
      error: () => {}
    });
    this.pedidoViagemService.getRideRequestById(pedidoId).subscribe({
      next: (pedido) => {
        if (!pedido || !pedido.driverId) {
          this.handleRideCancelledByClient();
          return;
        }
        this.pedido = pedido;
        if (typeof pedido.client === 'object' && pedido.client !== null) {
          this.nomeCliente = (pedido.client as any).name || '';
        } else {
          this.nomeCliente = '';
        }

        if (pedido.numberOfPeople) {
          this.numPessoas = pedido.numberOfPeople;
        }
        this.numPessoasConfirmado = localStorage.getItem(`numPessoasConfirmado_${pedidoId}`) === 'true';

        if (!pedido.endTime) {
          this.setupRouteMapData(pedido.entryAddress, pedido.exitAddress);
        }

        if (pedido.exitAddress) {
          void this.resolveAddress(pedido.exitAddress).then((addr) => {
            this.requestedDestination = addr;
          });
        }

        if (pedido.startTime) {
          this.startTimeLocal = new Date(pedido.startTime).toISOString();
          if (pedido.entryAddress) {
            void this.resolveAddress(pedido.entryAddress).then((addr) => {
              this.startLocal = addr;
            });
          }
        }

        if (pedido.endTime) {
          this.endTimeLocal = new Date(pedido.endTime).toISOString();
          this.bloquearBotoes = true;
          if (pedido.startTime) {
            const start = new Date(pedido.startTime).getTime();
            const end = new Date(pedido.endTime).getTime();
            this.duracaoViagem = Math.floor((end - start) / 60000);
          }
          if (pedido.price !== undefined && pedido.price !== null) {
            this.precoFinal = pedido.price;
          }
          if (pedido.exitAddress) {
            void this.resolveAddress(pedido.exitAddress).then((addr) => {
              this.endLocal = addr;
            });
          }
        }
      },
      error: (error) => {
        console.error('Error fetching ride request:', error);
        this.handleRideCancelledByClient();
      }
    });
    this.precoService.getPrice().subscribe({
      next: (preco) => { this.preco = preco; },
      error: (error) => { console.error('Error fetching price:', error); }
    });
  }

  async comecarViagem(): Promise<void> {
    if (!this.pedidoId || this.bloquearBotoes || this.isStartingTrip || this.isEndingTrip) {
      return;
    }
    this.isStartingTrip = true;
    try {
      const pos = await this.getRealGpsCoords();
      this.socketService.emitDriverLocation({
        pedidoId: this.pedidoId,
        lat: Number(pos.latitude),
        lon: Number(pos.longitude),
        heading: this.currentBearing
      });
      const entryAddress = `${pos.latitude},${pos.longitude}`;
      const startTime = new Date();
      this.pedidoViagemService.updateRideRequest(this.pedidoId, { startTime, entryAddress }).subscribe({
        next: () => {
          this.startTimeLocal = startTime.toISOString();
          if (this.pedido) {
            this.pedido.startTime = startTime;
            this.pedido.entryAddress = entryAddress;
          }
          if (this.pedido?.exitAddress) {
            this.setupRouteMapData(entryAddress, this.pedido.exitAddress);
          }
          this.startLocal = 'Resolving address...';
          this.isStartingTrip = false;
          void this.resolveAddress(entryAddress).then((addr) => {
            this.startLocal = addr;
          });
        },
        error: (error) => {
          this.isStartingTrip = false;
          console.error('Error starting trip:', error);
        }
      });
    } catch (error) {
      this.isStartingTrip = false;
      console.error('Error getting initial location:', error);
    }
  }

  async terminarViagem(): Promise<void> {
    if (!this.pedidoId || !this.pedido || this.bloquearBotoes || this.isEndingTrip || this.isStartingTrip) {
      return;
    }
    this.isEndingTrip = true;
    try {
      const pos = await this.getRealGpsCoords();
      const exitAddress = `${pos.latitude},${pos.longitude}`;
      const endTime = new Date();

      this.endLocal = 'Resolving address...';
      void this.resolveAddress(exitAddress).then((addr) => {
        this.endLocal = addr;
      });

      const start = new Date(this.pedido!.startTime!);
      const totalMinutos = Math.floor((endTime.getTime() - start.getTime()) / 60000);
      const minutosNoite = this.calcularTempoNoite(start, endTime);

      try {
        const taxi = await firstValueFrom(this.taxiService.getTaxiById(this.pedido!.taxi!));
        const confort = taxi?.confort || this.pedido!.confort;
        let precoMinuto = 0;
        if (confort === 'Basic') {
          precoMinuto = this.preco!.pricePerMinuteConfort;
        } else if (confort === 'Luxury') {
          precoMinuto = this.preco!.pricePerMinuteLuxury;
        }

        this.duracaoViagem = totalMinutos;
        const minutosDia = totalMinutos - minutosNoite;
        const precoDia = precoMinuto * minutosDia;
        const precoNoite = minutosNoite * (precoMinuto * (1 + (this.preco!.nightTimeSurcharge / 100)));
        this.precoFinal = Math.round((precoDia + precoNoite) * 100) / 100;

        this.pedidoViagemService.updateRideRequest(this.pedidoId, {
          endTime,
          exitAddress,
          price: this.precoFinal
        }).subscribe({
          next: () => {
            console.log('Trip finished and price updated:', this.precoFinal);
            this.endTimeLocal = endTime.toISOString();
            if (this.pedido) {
              this.pedido.endTime = endTime;
              this.pedido.exitAddress = exitAddress;
              this.pedido.price = this.precoFinal!;
            }
            this.bloquearBotoes = true;
            this.isEndingTrip = false;
          },
          error: (error) => {
            this.isEndingTrip = false;
            console.error('Error finishing trip:', error);
          }
        });
      } catch (error) {
        this.isEndingTrip = false;
        console.error('Error calculating trip price:', error);
      }
    } catch (error) {
      this.isEndingTrip = false;
      console.error('Error getting final location:', error);
    }
  }

  formatarHoraMinuto(dateString: string | null): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  private calcularTempoNoite(start: Date, end : Date) {
    let minutosNoite = 0;
    let current = new Date(start);
    while (current < end) {
      const hora = current.getHours();
      if (hora >= 21 || hora < 6) {
        minutosNoite++;
      }
      current.setMinutes(current.getMinutes() + 1);
    }
    return minutosNoite;
  }


  confirmarFimViagem(): void {
    if (!this.pedido || !this.pedido.endTime || !this.pedido.startTime || this.precoFinal === null) {
      this.snackBar.open('Incomplete trip data.', 'Close', { duration: 4000 });
      return;
    } else {

    // Get driver by ID to obtain NIF
    this.motoristaService.getDriverById(this.pedido.driverId!).subscribe({
      next: async (motorista) => {
        if (!motorista || !motorista.NIF) {
          this.snackBar.open('Could not find driver NIF.', 'Close', { duration: 4000 });
          return;
        }
        const startTimeISO = new Date(this.pedido!.startTime!).toISOString();

        const entryCoords = this.pedido!.entryAddress!.split(',').map(Number);
        const exitCoords = this.pedido!.exitAddress!.split(',').map(Number);
        let distanceKm = haversineDistance(
          entryCoords[0], entryCoords[1],
          exitCoords[0], exitCoords[1]
        );

        const samePoint =
          Math.abs(entryCoords[0] - exitCoords[0]) < 1e-6 &&
          Math.abs(entryCoords[1] - exitCoords[1]) < 1e-6;

        if (samePoint) {
          distanceKm = 0;
        } else {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);
          try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${entryCoords[1]},${entryCoords[0]};${exitCoords[1]},${exitCoords[0]}?overview=false`;
            const resp = await fetch(osrmUrl, { signal: controller.signal });
            if (resp.ok) {
              const data = await resp.json();
              const distMeters = data?.routes?.[0]?.distance;
              if (typeof distMeters === 'number') {
                distanceKm = parseFloat((distMeters / 1000).toFixed(2));
              }
            }
          } catch (err) {
            console.warn('OSRM distance fallback to Haversine:', err);
          } finally {
            clearTimeout(timeoutId);
          }
        }

        this.turnoService.getShiftsInTimeFrame(
          motorista.NIF,
          startTimeISO,
          startTimeISO
        ).subscribe({
          next: (turnos) => {
            const turno = turnos[0];
            const novaViagem = {
              shift: turno?._id,
              numberOfPeople: this.pedido!.numberOfPeople,
              distanceKm: distanceKm,
              entryTime: this.pedido!.startTime,
              exitTime: this.pedido!.endTime,
              entryAddress: this.pedido!.entryAddress,
              exitAddress: this.pedido!.exitAddress,
              entryAddressLabel: this.isResolvedLabel(this.startLocal) ? this.startLocal : undefined,
              exitAddressLabel: this.isResolvedLabel(this.endLocal) ? this.endLocal : undefined,
              driver: this.pedido!.driverId,
              client: this.pedido!.client,
              price: this.precoFinal
            };
            console.log('Data sent to createTrip:', novaViagem);
            this.viagemService.createTrip(novaViagem).subscribe({
              next: () => {
                this.isCompletingTrip = true;
                this.pedidoViagemService.deleteRideRequest(this.pedidoId).subscribe({
                  next: () => {
                    localStorage.removeItem(`numPessoasConfirmado_${this.pedidoId}`);
                    this.snackBar.open('Trip finished successfully!', 'Close', { duration: 3500 });
                    this.router.navigate(['/driver/portal']);
                  },
                  error: (error) => {
                    this.isCompletingTrip = false;
                    console.error('Error deleting ride request:', error);
                    this.snackBar.open('Error deleting ride request.', 'Close', { duration: 4000 });
                  }
                });
              },
              error: (error) => {
                console.error('Error creating trip:', error);
                this.snackBar.open('Error creating trip.', 'Close', { duration: 4000 });
              }
            });
          },
          error: (error) => {
            console.error('Error fetching shift:', error);
            this.snackBar.open('Error fetching shift.', 'Close', { duration: 4000 });
          }
        });
      },
      error: (error) => {
        console.error('Error fetching driver:', error);
        this.snackBar.open('Error fetching driver.', 'Close', { duration: 4000 });
      }
    });
  }
  }


  confirmarNumeroPessoas(): void {
    if (!this.pedidoId) return;
    this.pedidoViagemService.updateRideRequest(this.pedidoId, { numberOfPeople: this.numPessoas }).subscribe({
      next: () => {
        this.numPessoasConfirmado = true;
        localStorage.setItem(`numPessoasConfirmado_${this.pedidoId}`, 'true');
        if (this.pedido) this.pedido.numberOfPeople = this.numPessoas;
      },
      error: (error) => {
        console.error('Error confirming number of passengers:', error);
      }
    });
  }

  editarNumeroPessoas(): void {
    this.numPessoasConfirmado = false;
    if (this.pedidoId) {
      localStorage.removeItem(`numPessoasConfirmado_${this.pedidoId}`);
    }
  }

  private stopCheckCancelledInterval(): void {
    if (this.checkCancelledIntervalId !== null) {
      clearInterval(this.checkCancelledIntervalId);
      this.checkCancelledIntervalId = null;
    }
  }

  private handleRideCancelledByClient(): void {
    if (this.isCompletingTrip || this.endTimeLocal) return;
    this.isCompletingTrip = true;
    this.stopCheckCancelledInterval();
    if (this.pedidoId) {
      localStorage.removeItem(`numPessoasConfirmado_${this.pedidoId}`);
    }
    this.snackBar.open('The client cancelled this ride request.', 'Close', { duration: 4000 });
    this.router.navigate(['/driver/portal/pending-requests']);
  }

  ngOnDestroy(): void {
    this.stopCheckCancelledInterval();
    this.socketSub.unsubscribe();
    if (this.pedidoId) {
      this.socketService.leavePedido(this.pedidoId);
    }
    this.destroyRouteMap();
  }

  private async getRealGpsCoords(): Promise<{ latitude: string; longitude: string }> {
    if (this.lastGpsPos && Date.now() - this.lastGpsAt < 10000) {
      return this.lastGpsPos;
    }

    try {
      const pos = await firstValueFrom(this.geolocationService.getCurrentPosition());
      this.lastGpsPos = pos;
      this.lastGpsAt = Date.now();
      return pos;
    } catch (err) {
      if (this.lastGpsPos) {
        return this.lastGpsPos;
      }
      throw err;
    }
  }

  private isResolvedLabel(label: string): boolean {
    return Boolean(
      label &&
      label !== 'address not found' &&
      label !== 'Resolving address...' &&
      !this.geolocationService.isCoordinateString(label)
    );
  }

  private async resolveAddress(coords: string): Promise<string> {
    const parts = coords.split(',').map(part => part.trim());
    if (parts.length !== 2 || parts.some(part => !part || isNaN(Number(part)))) {
      return coords;
    }
    try {
      const resolved = await this.geolocationService.resolveDisplayAddress(coords);
      return resolved || 'address not found';
    } catch {
      return 'address not found';
    }
  }

  private parseCoords(coords?: string): [number, number] | null {
    if (!coords) return null;
    const parts = coords.split(',').map(part => Number(part.trim()));
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return [parts[0], parts[1]];
  }

  private setupRouteMapData(entryAddress?: string, exitAddress?: string): void {
    this.pickupCoords = this.parseCoords(entryAddress);
    this.destCoords = this.parseCoords(exitAddress);
    if (!this.pickupCoords || !this.destCoords) return;

    const [pLat, pLng] = this.pickupCoords;
    const [dLat, dLng] = this.destCoords;
    this.googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pLat},${pLng}&destination=${dLat},${dLng}&travelmode=driving`;

    setTimeout(() => {
      void this.initRouteMap();
    }, 0);
  }

  private destroyRouteMap(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.carMarker) {
      this.carMarker.remove();
      this.carMarker = null;
    }
    if (this.routeMap) {
      this.routeMap.remove();
      this.routeMap = null;
      this.approachOuterLine = null;
      this.approachInnerLine = null;
      this.tripOuterLine = null;
    }
  }

  toggleFollowGps(): void {
    this.followGps = !this.followGps;
    if (!this.routeMap) return;

    if (this.followGps && this.lastCarPos) {
      const [lat, lng] = this.lastCarPos;
      this.routeMap.setView([lat, lng], 16, { animate: true });
    } else if (this.routeBounds) {
      this.routeMap.fitBounds(this.routeBounds, { padding: [40, 40], animate: true });
    }
  }

  private async initRouteMap(): Promise<void> {
    if (!this.pickupCoords || !this.destCoords) return;
    const mapEl = document.getElementById('driverRouteMap');
    if (!mapEl) return;

    this.destroyRouteMap();

    const [pLat, pLng] = this.pickupCoords;
    const [dLat, dLng] = this.destCoords;

    let routeCoords: [number, number][] = [[pLng, pLat], [dLng, dLat]];
    this.routeSteps = [];
    this.routeDistanceLabel = '';
    this.routeDurationLabel = '';
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const route = data?.routes?.[0];
        const coords: [number, number][] | undefined = route?.geometry?.coordinates;
        if (coords && coords.length > 0) {
          routeCoords = coords;
        }
        if (typeof route?.distance === 'number') {
          this.routeDistanceLabel = route.distance >= 1000
            ? `${(route.distance / 1000).toFixed(1)} km`
            : `${Math.round(route.distance)} m`;
        }
        if (typeof route?.duration === 'number') {
          const mins = Math.max(1, Math.round(route.duration / 60));
          this.routeDurationLabel = `${mins} min`;
        }
        const rawSteps = route?.legs?.[0]?.steps;
        if (Array.isArray(rawSteps)) {
          this.routeSteps = rawSteps.map((s: any) => this.formatOsrmStep(s));
        }
      }
    } catch (err) {
      console.warn('OSRM routing unavailable, using direct line fallback:', err);
    }

    const startLatLng: [number, number] = [routeCoords[0][1], routeCoords[0][0]];
    const nextLatLng: [number, number] = routeCoords.length > 1
      ? [routeCoords[1][1], routeCoords[1][0]]
      : [dLat, dLng];
    this.currentBearing = this.calculateBearing(startLatLng, nextLatLng);

    const routeLatLngs: [number, number][] = routeCoords.map(([lng, lat]) => [lat, lng]);
    this.routeBounds = L.latLngBounds(routeLatLngs);

    this.routeMap = L.map(mapEl, {
      center: [pLat, pLng],
      zoom: 15
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.routeMap);

    // Draw crisp two-layer blue route line along the roads
    this.tripOuterLine = L.polyline(routeLatLngs, { color: '#1d4ed8', weight: 9, opacity: 0.9 }).addTo(this.routeMap);
    L.polyline(routeLatLngs, { color: '#3b82f6', weight: 5, opacity: 1 }).addTo(this.routeMap);

    const makePinIcon = (color: string) =>
      L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

    L.marker([pLat, pLng], { icon: makePinIcon('#16a34a') })
      .bindPopup('<b>Pickup Location</b>')
      .addTo(this.routeMap);

    L.marker([dLat, dLng], { icon: makePinIcon('#dc2626') })
      .bindPopup('<b>Requested Destination</b>')
      .addTo(this.routeMap);

    if (!this.startTimeLocal && this.lastGpsPos) {
      await this.drawApproachRouteFromGps(
        Number(this.lastGpsPos.latitude),
        Number(this.lastGpsPos.longitude),
        !this.followGps
      );
    } else {
      this.placeCarArrow(startLatLng, this.currentBearing);
    }
    this.startLiveGpsTracking();

    if (!this.followGps && this.routeBounds) {
      this.routeMap.fitBounds(this.routeBounds, { padding: [40, 40] });
    }

    setTimeout(() => this.routeMap?.invalidateSize(), 150);
  }

  private async drawApproachRouteFromGps(driverLat: number, driverLon: number, fitAllBounds: boolean): Promise<void> {
    if (!this.routeMap || this.startTimeLocal || !this.pickupCoords || !this.destCoords) return;
    if (!Number.isFinite(driverLat) || !Number.isFinite(driverLon)) return;

    const [pLat, pLng] = this.pickupCoords;
    let approachLatLngs: [number, number][] = [[driverLat, driverLon], [pLat, pLng]];
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${driverLon},${driverLat};${pLng},${pLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const coords: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
        if (coords && coords.length >= 2) {
          approachLatLngs = coords.map(([lng, lat]) => [lat, lng]);
        }
      }
    } catch {
      // Fall back to direct approach line if OSRM is unreachable
    }

    if (!this.routeMap || this.startTimeLocal) return;

    if (this.approachOuterLine) {
      this.approachOuterLine.setLatLngs(approachLatLngs);
    } else {
      this.approachOuterLine = L.polyline(approachLatLngs, { color: '#15803d', weight: 8, opacity: 0.9 }).addTo(this.routeMap);
    }
    if (this.approachInnerLine) {
      this.approachInnerLine.setLatLngs(approachLatLngs);
    } else {
      this.approachInnerLine = L.polyline(approachLatLngs, { color: '#22c55e', weight: 4.5, opacity: 1, dashArray: '8, 8' }).addTo(this.routeMap);
    }

    const nextApproach = approachLatLngs.length > 1 ? approachLatLngs[1] : this.pickupCoords;
    const bearing = this.calculateBearing([driverLat, driverLon], nextApproach);
    this.placeCarArrow([driverLat, driverLon], bearing);

    const bounds = L.latLngBounds([this.pickupCoords, this.destCoords, ...approachLatLngs]);
    if (this.tripOuterLine) {
      bounds.extend(this.tripOuterLine.getBounds());
    }
    this.routeBounds = bounds;
    if (fitAllBounds) {
      this.routeMap.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  toggleSteps(): void {
    this.showAllSteps = !this.showAllSteps;
  }

  private formatOsrmStep(step: any): { instruction: string; distanceText: string; icon: string } {
    const type = step?.maneuver?.type || 'continue';
    const modifier = step?.maneuver?.modifier || '';
    const road = step?.name ? ` onto ${step.name}` : '';
    const dist = typeof step?.distance === 'number'
      ? (step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`)
      : '';

    let instruction = `Continue${road}`;
    let icon = 'straight';

    if (type === 'depart') {
      instruction = `Start${road || ' on route'}`;
      icon = 'navigation';
    } else if (type === 'arrive') {
      instruction = 'Arrive at destination';
      icon = 'place';
    } else if (type === 'roundabout' || type === 'rotary') {
      const exitNum = step?.maneuver?.exit;
      instruction = exitNum ? `Take exit ${exitNum} at roundabout${road}` : `Enter roundabout${road}`;
      icon = 'roundabout_right';
    } else if (modifier.includes('left')) {
      instruction = `Turn left${road}`;
      icon = 'turn_left';
    } else if (modifier.includes('right')) {
      instruction = `Turn right${road}`;
      icon = 'turn_right';
    }

    return { instruction, distanceText: dist, icon };
  }

  private createPinElement(color: string): HTMLElement {
    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = color;
    el.style.border = '3px solid #ffffff';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)';
    return el;
  }

  private createArrowIcon(bearingDeg: number): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));transform:rotate(${bearingDeg}deg);transition:transform 0.3s ease;">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#2563eb" stroke="#ffffff" stroke-width="2.5"/>
            <polygon points="16,6 23,23 16,19 9,23" fill="#ffffff"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }

  private placeCarArrow(pos: [number, number], bearingDeg: number): void {
    if (!this.routeMap) return;
    const [lat, lng] = pos;
    this.currentBearing = bearingDeg;

    if (this.carMarker) {
      this.carMarker.setLatLng([lat, lng]);
      this.carMarker.setIcon(this.createArrowIcon(bearingDeg));
    } else {
      this.carMarker = L.marker([lat, lng], { icon: this.createArrowIcon(bearingDeg) })
        .bindPopup('<b>Your Taxi (GPS)</b>')
        .addTo(this.routeMap);
    }

    this.lastCarPos = pos;

    if (this.followGps) {
      this.routeMap.setView([lat, lng], 16, { animate: true });
    }
  }

  private startLiveGpsTracking(): void {
    if (!navigator.geolocation || this.watchId !== null) return;
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastGpsPos = {
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        };
        this.lastGpsAt = Date.now();
        const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
        let bearing = position.coords.heading;
        if (bearing === null || bearing === undefined || isNaN(bearing)) {
          bearing = this.lastCarPos ? this.calculateBearing(this.lastCarPos, newPos) : 0;
        }
        this.placeCarArrow(newPos, bearing);
        if (this.pedidoId) {
          this.socketService.emitDriverLocation({
            pedidoId: this.pedidoId,
            lat: newPos[0],
            lon: newPos[1],
            heading: bearing
          });
        }
      },
      (err) => {
        console.warn('GPS watchPosition unavailable:', err.message);
      },
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 10000 }
    );
  }

  private calculateBearing(from: [number, number], to: [number, number]): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const lat1 = toRad(from[0]);
    const lon1 = toRad(from[1]);
    const lat2 = toRad(to[0]);
    const lon2 = toRad(to[1]);
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }


}

// Utility function outside the class
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



