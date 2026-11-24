import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { RideRequestService } from '../../appServices/ride-request.service';
import { SocketService } from '../../appServices/socket.service';
import { AlertNotificationService } from '../../appServices/alert-notification.service';
import { RideRequest } from '../ride-request.interface';
import { ActivatedRoute } from '@angular/router';
import { GeolocationService } from '../../appServices/geolocation.service';
import { DriverService } from '../../appServices/driver.service';
import { TaxiService } from '../../appServices/taxi.service';
import { TripService } from '../../appServices/trip.service';
import { Trip } from '../../trips/trip.interface';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getTaxiCarImage } from '../../appServices/taxi-icon.util';

@Component({
  selector: 'app-acompanhar-viagem',
  templateUrl: './track-trip.component.html',
  styleUrls: ['./track-trip.component.css']
})
export class TrackTripComponent implements OnInit, OnDestroy {
  status: 'aguardando' | 'emCurso' | 'finalizada' = 'aguardando';
  pedido: RideRequest | null = null;
  pedidoId: string = '';
  preco: number = 0;
  partidaNome: string = '';
  destinoNome: string = '';
  motoristaNome: string = '';
  motoristaRatingAverage: number = 0;
  motoristaRatingCount: number = 0;
  selectedRating: number = 0;
  hoverRating: number = 0;
  ratingComment: string = '';
  isSubmittingRating: boolean = false;
  ratingSubmitted: boolean = false;
  readonly starValues: number[] = [1, 2, 3, 4, 5];
  taxiMatricula: string = '';
  taxiMarca: string = '';
  taxiModelo: string = '';
  tempoMotorista: number = 0;
  horaPartida: Date = new Date();
  horaChegada: Date = new Date();
  tempoRestanteMin: number | null = null;
  horaEstimadaChegada: Date | null = null;
  distanciaRestanteLabel: string = '';
  private ultimoEntryAddress: string = '';
  private ultimoExitAddress: string = '';
  private subscriptions = new Subscription();
  private trackMap: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private taxiMarker: L.Marker | null = null;
  private routeOuterLine: L.Polyline | null = null;
  private routeInnerLine: L.Polyline | null = null;
  private lastRouteLatLngs: [number, number][] | null = null;
  private driverToPickupOuterLine: L.Polyline | null = null;
  private driverToPickupInnerLine: L.Polyline | null = null;
  private lastDriverToPickupLatLngs: [number, number][] | null = null;
  private lastDriverPickupOrigin: [number, number] | null = null;
  private lastDriverPickupFetchMs: number = 0;
  private driverPickupFetchInFlight: boolean = false;
  private mapInitialized: boolean = false;
  private pendingTaxiLocation: { lat: number; lon: number; heading: number } | null = null;
  private pollIntervalId: any = null;
  private taxiAtualCoords: [number, number] | null = null;
  private lastOsrmOrigin: [number, number] | null = null;
  private lastOsrmFetchMs: number = 0;
  private lastOsrmSpeedMps: number | null = null;
  private osrmFetchInFlight: boolean = false;
  private lastProcessedEntryAddress: string = '';
  hasLiveTaxiLocation: boolean = false;
  showCancelModal: boolean = false;
  isCancelling: boolean = false;
  private hasInitializedStatus: boolean = false;


  constructor(
    private pedidoViagemService: RideRequestService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private geolocationService: GeolocationService,
    private motoristaService: DriverService,
    private taxiService: TaxiService,
    private tripService: TripService,
    private router: Router,
    private snackBar: MatSnackBar,
    private alertService: AlertNotificationService
  ){}

  ngOnInit() {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      console.error('Ride request ID not provided');
      return;
    }
    this.pedidoId = pedidoId;
    this.socketService.joinPedido(pedidoId);

    this.pedidoViagemService.getRideRequestById(pedidoId).subscribe(res => {
      if (res) {
        this.processarEstadoPedido(res);
      }
    });

    this.subscriptions.add(
      this.socketService.onEvent<RideRequest>('pedido:updated').subscribe((pedidoAtualizado) => {
        if (pedidoAtualizado && (!pedidoAtualizado._id || String(pedidoAtualizado._id) === String(this.pedidoId))) {
          this.processarEstadoPedido(pedidoAtualizado);
        }
      })
    );

    this.pollIntervalId = setInterval(() => {
      if (this.status === 'finalizada') {
        this.stopPolling();
        return;
      }
      this.pedidoViagemService.getRideRequestById(pedidoId).subscribe({
        next: (res) => {
          if (res) {
            this.processarEstadoPedido(res);
          }
        },
        error: () => {
          // Ignore transient poll errors; next tick or socket update will retry
        }
      });
    }, 3000);

    this.subscriptions.add(
      this.socketService
        .onEvent<{ pedidoId: string; lat: number; lon: number; heading?: number | null }>('driver:location')
        .subscribe((loc) => {
          if (loc && String(loc.pedidoId) === String(this.pedidoId)) {
            this.updateTaxiMarker(loc.lat, loc.lon, loc.heading || 0);
          }
        })
    );
  }

  private processarEstadoPedido(res: RideRequest) {
    this.pedido = res;

    if (res.driverId && !this.motoristaNome) {
      this.motoristaService.getDriverById(res.driverId).subscribe(motorista => {
        this.motoristaNome = motorista.name;
        this.motoristaRatingAverage = motorista.ratingAverage || 0;
        this.motoristaRatingCount = motorista.ratingCount || 0;
      });
    }
    if (res.rating && res.rating >= 1 && res.rating <= 5 && !this.ratingSubmitted) {
      this.selectedRating = res.rating;
      this.ratingComment = res.ratingComment || '';
      this.ratingSubmitted = true;
    }
    if (res.taxi && !this.taxiMatricula) {
      this.taxiService.getTaxiById(res.taxi).subscribe(taxi => {
        this.taxiMatricula = taxi.licensePlate;
        this.taxiMarca = taxi.brand;
        this.taxiModelo = taxi.model;
      });
    }
    if (res.distanceKmToDriver && !this.hasLiveTaxiLocation) {
      this.tempoMotorista = res.distanceKmToDriver;
    }
    this.atualizarNomesLocalidades(res);
    const prevStatus = this.status;
    if (!res.startTime) {
      this.status = 'aguardando';
    } else if (res.startTime && !res.endTime) {
      this.status = 'emCurso';
      this.horaPartida = res.startTime;
    } else if (res.endTime) {
      this.status = 'finalizada';
      this.horaChegada = res.endTime;
      if (res.price !== undefined && res.price !== null) {
        this.preco = res.price;
      }
      this.stopPolling();
      this.destroyTrackMap();
    }

    if (this.hasInitializedStatus) {
      if (prevStatus === 'aguardando' && this.status === 'emCurso') {
        this.alertService.notify({
          title: 'Trip Started',
          body: 'Your driver has started the trip. Have a safe ride!',
          sound: 'trip-update',
          tag: `client-trip-started-${this.pedidoId}`
        });
      } else if (prevStatus !== 'finalizada' && this.status === 'finalizada') {
        this.alertService.notify({
          title: 'Trip Completed',
          body: `You have arrived! Final fare: €${this.preco.toFixed(2)}`,
          sound: 'trip-update',
          tag: `client-trip-finished-${this.pedidoId}`
        });
      }
    }
    this.hasInitializedStatus = true;

    if (this.status !== 'finalizada' && res.entryAddress && res.exitAddress) {
      const entryChanged = res.entryAddress !== this.lastProcessedEntryAddress;
      this.lastProcessedEntryAddress = res.entryAddress;
      const pickupCoords = this.parseCoords(res.entryAddress);

      if (this.status === 'emCurso') {
        this.clearDriverToPickupRoute();
      }

      if (!this.mapInitialized) {
        this.initTrackMap(res.entryAddress, res.exitAddress);
      } else if (entryChanged && !this.hasLiveTaxiLocation && pickupCoords) {
        this.taxiAtualCoords = pickupCoords;
        this.pickupMarker?.setLatLng(pickupCoords);
        if (this.status === 'emCurso') {
          this.updateTaxiMarker(pickupCoords[0], pickupCoords[1], 0, false);
        }
        void this.recalcularTempoPorDistanciaRestante(pickupCoords, true);
      }

      if (this.status === 'aguardando' && pickupCoords) {
        if (!this.lastRouteLatLngs || entryChanged) {
          void this.recalcularTempoPorDistanciaRestante(pickupCoords, true);
        }
        if (this.taxiAtualCoords && this.lastDriverPickupOrigin === null) {
          void this.recalcularRotaMotoristaAtePickup(this.taxiAtualCoords, true);
        }
      } else if (this.status === 'emCurso') {
        const origin = this.taxiAtualCoords ?? pickupCoords;
        const justStarted = prevStatus !== 'emCurso';
        if (origin && (justStarted || this.tempoRestanteMin === null || !this.distanciaRestanteLabel)) {
          void this.recalcularTempoPorDistanciaRestante(origin, justStarted || this.lastOsrmOrigin === null);
        }
      }
    }
  }

  private stopPolling(): void {
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
    this.destroyTrackMap();
    if (this.pedidoId) {
      this.socketService.leavePedido(this.pedidoId);
    }
    this.subscriptions.unsubscribe();
  }

  private destroyTrackMap(): void {
    if (this.trackMap) {
      this.trackMap.remove();
      this.trackMap = null;
      this.pickupMarker = null;
      this.taxiMarker = null;
      this.routeOuterLine = null;
      this.routeInnerLine = null;
      this.driverToPickupOuterLine = null;
      this.driverToPickupInnerLine = null;
      this.mapInitialized = false;
    }
  }

  private parseCoords(raw: string): [number, number] | null {
    if (!raw || !raw.includes(',')) return null;
    const [latStr, lonStr] = raw.split(',').map(s => s.trim());
    const lat = Number(latStr);
    const lon = Number(lonStr);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
  }

  private calcularDistanciaKm(a: [number, number], b: [number, number]): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private formatarDistanciaMetros(metros: number): string {
    if (!Number.isFinite(metros) || metros < 0) return '';
    return metros >= 1000
      ? `${(metros / 1000).toFixed(1)} km`
      : `${Math.round(metros)} m`;
  }

  private estimarTempoMinPorDistancia(distKm: number): number {
    const roadDistMeters = distKm * 1300;
    const speedMps = this.lastOsrmSpeedMps ?? (35 * 1000) / 3600;
    return Math.max(1, Math.round(roadDistMeters / speedMps / 60));
  }

  private upsertDoublePolyline(
    outer: L.Polyline | null,
    inner: L.Polyline | null,
    latLngs: [number, number][],
    outerOpts: L.PolylineOptions,
    innerOpts: L.PolylineOptions
  ): { outer: L.Polyline; inner: L.Polyline } | null {
    if (!this.trackMap || latLngs.length < 2) return null;
    const nextOuter = outer
      ? outer.setLatLngs(latLngs)
      : L.polyline(latLngs, outerOpts).addTo(this.trackMap);
    const nextInner = inner
      ? inner.setLatLngs(latLngs)
      : L.polyline(latLngs, innerOpts).addTo(this.trackMap);
    return { outer: nextOuter, inner: nextInner };
  }

  private clearDriverToPickupRoute(): void {
    if (this.driverToPickupOuterLine) {
      this.driverToPickupOuterLine.remove();
      this.driverToPickupOuterLine = null;
    }
    if (this.driverToPickupInnerLine) {
      this.driverToPickupInnerLine.remove();
      this.driverToPickupInnerLine = null;
    }
    this.lastDriverToPickupLatLngs = null;
  }

  private updateRoutePolyline(routeLatLngs: [number, number][], fitBounds: boolean): void {
    this.lastRouteLatLngs = routeLatLngs;
    const updated = this.upsertDoublePolyline(
      this.routeOuterLine,
      this.routeInnerLine,
      routeLatLngs,
      { color: '#1d4ed8', weight: 8, opacity: 0.9 },
      { color: '#3b82f6', weight: 4.5, opacity: 1 }
    );
    if (!updated) return;
    this.routeOuterLine = updated.outer;
    this.routeInnerLine = updated.inner;
    if (fitBounds) {
      this.fitCombinedMapBounds(routeLatLngs);
    }
  }

  private updateDriverToPickupPolyline(latLngs: [number, number][], fitBounds: boolean): void {
    this.lastDriverToPickupLatLngs = latLngs;
    const updated = this.upsertDoublePolyline(
      this.driverToPickupOuterLine,
      this.driverToPickupInnerLine,
      latLngs,
      { color: '#15803d', weight: 8, opacity: 0.9 },
      { color: '#22c55e', weight: 4.5, opacity: 1, dashArray: '8, 8' }
    );
    if (!updated) return;
    this.driverToPickupOuterLine = updated.outer;
    this.driverToPickupInnerLine = updated.inner;
    if (fitBounds) {
      this.fitCombinedMapBounds(latLngs);
    }
  }

  private fitCombinedMapBounds(extraPoints: [number, number][] = []): void {
    if (!this.trackMap) return;
    const points: [number, number][] = [...extraPoints];
    if (this.taxiAtualCoords) points.push(this.taxiAtualCoords);
    const pickup = this.pedido?.entryAddress ? this.parseCoords(this.pedido.entryAddress) : null;
    const dest = this.pedido?.exitAddress ? this.parseCoords(this.pedido.exitAddress) : null;
    if (pickup) points.push(pickup);
    if (dest) points.push(dest);
    if (this.lastRouteLatLngs) points.push(...this.lastRouteLatLngs);
    if (this.lastDriverToPickupLatLngs) points.push(...this.lastDriverToPickupLatLngs);
    if (points.length >= 2) {
      this.trackMap.fitBounds(L.latLngBounds(points), { padding: [45, 45], maxZoom: 15 });
    }
  }

  private async fetchOsrmRoute(
    from: [number, number],
    to: [number, number]
  ): Promise<{ distance?: number; duration?: number; latLngs: [number, number][] }> {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const resp = await fetch(osrmUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const route = data?.routes?.[0];
    if (!route) throw new Error('No OSRM route');
    const coords: [number, number][] = route?.geometry?.coordinates || [];
    return {
      distance: typeof route.distance === 'number' ? route.distance : undefined,
      duration: typeof route.duration === 'number' ? route.duration : undefined,
      latLngs: coords.map(([lng, lat]) => [lat, lng])
    };
  }

  private isTripFinished(): boolean {
    return this.status === 'finalizada';
  }

  private isWaitingForDriver(): boolean {
    return this.status === 'aguardando';
  }

  private async recalcularRotaMotoristaAtePickup(
    driverPos: [number, number],
    forceOsrm: boolean = false
  ): Promise<void> {
    if (!this.isWaitingForDriver() || !this.pedido?.entryAddress) return;
    const pickup = this.parseCoords(this.pedido.entryAddress);
    if (!pickup) return;

    const agora = Date.now();
    const movedMeters = this.lastDriverPickupOrigin
      ? this.calcularDistanciaKm(this.lastDriverPickupOrigin, driverPos) * 1000
      : Infinity;

    const shouldFetchOsrm =
      forceOsrm ||
      !this.lastDriverPickupOrigin ||
      movedMeters > 10 ||
      agora - this.lastDriverPickupFetchMs >= 3000;

    if (!shouldFetchOsrm || this.driverPickupFetchInFlight) {
      return;
    }

    this.driverPickupFetchInFlight = true;
    this.lastDriverPickupFetchMs = agora;
    const isInitialApproach = this.lastDriverPickupOrigin === null;
    this.lastDriverPickupOrigin = driverPos;

    try {
      const route = await this.fetchOsrmRoute(driverPos, pickup);
      if (!this.isWaitingForDriver()) return;

      if (route.duration !== undefined) {
        this.tempoMotorista = Math.max(1, Math.round(route.duration / 60));
      }
      if (route.latLngs.length >= 2) {
        this.updateDriverToPickupPolyline(route.latLngs, isInitialApproach);
      } else {
        this.updateDriverToPickupPolyline([driverPos, pickup], isInitialApproach);
      }
    } catch {
      if (!this.isWaitingForDriver()) return;
      const distKm = this.calcularDistanciaKm(driverPos, pickup);
      this.tempoMotorista = this.estimarTempoMinPorDistancia(distKm);
      this.updateDriverToPickupPolyline([driverPos, pickup], isInitialApproach);
    } finally {
      this.driverPickupFetchInFlight = false;
    }
  }

  private async recalcularTempoPorDistanciaRestante(
    origin: [number, number],
    forceOsrm: boolean = false
  ): Promise<void> {
    if (this.isTripFinished() || !this.pedido?.exitAddress) return;
    const dest = this.parseCoords(this.pedido.exitAddress);
    if (!dest) return;

    const distKm = this.calcularDistanciaKm(origin, dest);
    const agora = Date.now();
    const movedMeters = this.lastOsrmOrigin
      ? this.calcularDistanciaKm(this.lastOsrmOrigin, origin) * 1000
      : Infinity;

    const shouldFetchOsrm =
      forceOsrm ||
      !this.lastOsrmOrigin ||
      movedMeters > 10 ||
      agora - this.lastOsrmFetchMs >= 3000;

    if (!shouldFetchOsrm || this.osrmFetchInFlight) {
      return;
    }

    this.osrmFetchInFlight = true;
    this.lastOsrmFetchMs = agora;
    const isInitialRoute = this.lastOsrmOrigin === null;
    this.lastOsrmOrigin = origin;

    try {
      const route = await this.fetchOsrmRoute(origin, dest);
      if (this.isTripFinished()) return;

      if (route.distance !== undefined && route.duration !== undefined && route.duration > 0) {
        this.lastOsrmSpeedMps = route.distance / route.duration;
      }
      if (route.distance !== undefined) {
        this.distanciaRestanteLabel = this.formatarDistanciaMetros(route.distance);
      }
      if (route.duration !== undefined) {
        this.tempoRestanteMin = Math.max(1, Math.round(route.duration / 60));
        this.horaEstimadaChegada = new Date(Date.now() + this.tempoRestanteMin * 60000);
      }

      if (route.latLngs.length >= 2) {
        this.updateRoutePolyline(route.latLngs, isInitialRoute);
      }
    } catch (err) {
      console.warn('OSRM route estimate fallback to distance:', err);
      if (this.isTripFinished()) return;
      this.distanciaRestanteLabel = this.formatarDistanciaMetros(distKm * 1000);
      this.tempoRestanteMin = this.estimarTempoMinPorDistancia(distKm);
      this.horaEstimadaChegada = new Date(Date.now() + this.tempoRestanteMin * 60000);
    } finally {
      this.osrmFetchInFlight = false;
    }
  }

  private initTrackMap(entryAddress: string, exitAddress: string): void {
    const pickup = this.parseCoords(entryAddress);
    const dest = this.parseCoords(exitAddress);
    if (!pickup || !dest) return;

    this.mapInitialized = true;
    setTimeout(async () => {
      const container = document.getElementById('clientTrackMap');
      if (!container || this.trackMap) return;

      this.trackMap = L.map(container, {
        center: [(pickup[0] + dest[0]) / 2, (pickup[1] + dest[1]) / 2],
        zoom: 13
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.trackMap);

      const makePin = (color: string) =>
        L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

      this.pickupMarker = L.marker([pickup[0], pickup[1]], { icon: makePin('#16a34a') })
        .bindPopup('Pickup')
        .addTo(this.trackMap);

      L.marker([dest[0], dest[1]], { icon: makePin('#dc2626') })
        .bindPopup('Destination')
        .addTo(this.trackMap);

      const bounds = L.latLngBounds([pickup, dest]);
      this.trackMap.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });

      if (this.pendingTaxiLocation) {
        this.updateTaxiMarker(
          this.pendingTaxiLocation.lat,
          this.pendingTaxiLocation.lon,
          this.pendingTaxiLocation.heading
        );
        this.pendingTaxiLocation = null;
      } else if (this.status === 'emCurso') {
        this.updateTaxiMarker(pickup[0], pickup[1], 0, false);
      }

      if (this.lastRouteLatLngs) {
        this.updateRoutePolyline(this.lastRouteLatLngs, true);
      } else {
        const tripOrigin = this.status === 'aguardando' ? pickup : (this.taxiAtualCoords ?? pickup);
        await this.recalcularTempoPorDistanciaRestante(tripOrigin, true);
      }

      if (this.status === 'aguardando' && this.taxiAtualCoords) {
        if (this.lastDriverToPickupLatLngs) {
          this.updateDriverToPickupPolyline(this.lastDriverToPickupLatLngs, true);
        } else {
          await this.recalcularRotaMotoristaAtePickup(this.taxiAtualCoords, true);
        }
      }

      setTimeout(() => this.trackMap?.invalidateSize(), 100);
    }, 80);
  }

  private updateTaxiMarker(lat: number, lon: number, heading: number, isLive: boolean = true): void {
    if (isLive) {
      this.hasLiveTaxiLocation = true;
      this.taxiAtualCoords = [lat, lon];
      if (this.status === 'aguardando' && this.pedido?.entryAddress) {
        void this.recalcularRotaMotoristaAtePickup([lat, lon]);
      } else if (this.status === 'emCurso' && this.pedido?.exitAddress) {
        void this.recalcularTempoPorDistanciaRestante([lat, lon]);
      }
    }
    if (!this.trackMap) {
      if (isLive) {
        this.pendingTaxiLocation = { lat, lon, heading };
      }
      return;
    }

    const taxiIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));">🚕</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (!this.taxiMarker) {
      this.taxiMarker = L.marker([lat, lon], { icon: taxiIcon })
        .bindPopup('Your Taxi')
        .addTo(this.trackMap);
    } else {
      this.taxiMarker.setLatLng([lat, lon]);
    }
  }

  async atualizarNomesLocalidades(pedido: RideRequest) {
    if (pedido.entryAddressLabel && this.partidaNome !== pedido.entryAddressLabel) {
      this.partidaNome = pedido.entryAddressLabel;
    }
    if (pedido.entryAddress && pedido.entryAddress !== this.ultimoEntryAddress) {
      this.ultimoEntryAddress = pedido.entryAddress;
      if (!pedido.entryAddressLabel) {
        const [lat, lon] = pedido.entryAddress.split(',');
        this.partidaNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
      }
    }
    if (pedido.exitAddressLabel && this.destinoNome !== pedido.exitAddressLabel) {
      this.destinoNome = pedido.exitAddressLabel;
    }
    if (pedido.exitAddress && pedido.exitAddress !== this.ultimoExitAddress) {
      this.ultimoExitAddress = pedido.exitAddress;
      if (!pedido.exitAddressLabel) {
        const [lat, lon] = pedido.exitAddress.split(',');
        this.destinoNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
      }
    }
  }

  abrirModalCancelar(): void {
    this.showCancelModal = true;
  }

  fecharModalCancelar(): void {
    if (!this.isCancelling) {
      this.showCancelModal = false;
    }
  }

  cancelarViagem() {
    if (!this.pedidoId || this.isCancelling) return;
    this.isCancelling = true;
    this.pedidoViagemService.deleteRideRequest(this.pedidoId).subscribe({
      next: () => {
        localStorage.removeItem('pedidoId');
        this.showCancelModal = false;
        this.router.navigate(['/client']);
      },
      error: (err) => {
        this.isCancelling = false;
        this.showCancelModal = false;
        console.error('Error cancelling ride:', err);
        this.snackBar.open('Could not cancel the ride. Please try again.', 'Close', { duration: 3500 });
      }
    });
  }

  getDuracaoViagemMinutos(): number | null {
    if (!this.pedido?.startTime || !this.pedido?.endTime) return null;
    const inicio = new Date(this.pedido.startTime).getTime();
    const fim = new Date(this.pedido.endTime).getTime();
    return Math.floor((fim - inicio) / 60000); // minutes
  }

  setRating(stars: number): void {
    if (this.ratingSubmitted || this.isSubmittingRating) return;
    this.selectedRating = stars;
  }

  submitRating(): void {
    if (this.selectedRating < 1 || this.isSubmittingRating || this.ratingSubmitted || !this.pedidoId) {
      return;
    }

    this.isSubmittingRating = true;
    const comment = this.ratingComment.trim().slice(0, 500);

    this.pedidoViagemService.updateRideRequest(this.pedidoId, {
      rating: this.selectedRating,
      ratingComment: comment
    }).subscribe({
      next: () => {
        this.ratingSubmitted = true;
        this.isSubmittingRating = false;
        this.snackBar.open('Thank you for rating your driver!', 'Close', { duration: 3500 });
      },
      error: () => {
        // RideRequest may have been converted into a Trip already; fall back to Trip rating
        this.rateCompletedTripFallback(comment);
      }
    });
  }

  private rateCompletedTripFallback(comment: string): void {
    const clientId = typeof this.pedido?.client === 'object' && this.pedido?.client !== null
      ? (this.pedido.client as any)._id
      : this.pedido?.client;
    const driverId = this.pedido?.driverId;
    const targetStartMs = this.pedido?.startTime ? new Date(this.pedido.startTime).getTime() : null;

    this.tripService.getAllTrips().subscribe({
      next: (trips: Trip[]) => {
        const candidates = (trips || []).filter((t) => {
          const tClientId = typeof t.client === 'object' && t.client !== null ? (t.client as any)._id : t.client;
          const tDriverId = typeof t.driver === 'object' && t.driver !== null ? (t.driver as any)._id : t.driver;
          return (!clientId || String(tClientId) === String(clientId)) &&
            (!driverId || String(tDriverId) === String(driverId));
        });

        let matchedTrip = candidates[0];
        if (candidates.length > 1 && targetStartMs !== null) {
          matchedTrip = [...candidates].sort(
            (a, b) =>
              Math.abs(new Date(a.entryTime).getTime() - targetStartMs) -
              Math.abs(new Date(b.entryTime).getTime() - targetStartMs)
          )[0];
        }

        if (!matchedTrip?._id) {
          this.isSubmittingRating = false;
          this.snackBar.open('Could not submit rating. You can rate this trip from Trip History.', 'Close', {
            duration: 4000
          });
          return;
        }

        this.tripService.rateTrip(matchedTrip._id, this.selectedRating, comment).subscribe({
          next: (res) => {
            this.ratingSubmitted = true;
            this.isSubmittingRating = false;
            if (typeof res?.ratingAverage === 'number') {
              this.motoristaRatingAverage = res.ratingAverage;
              this.motoristaRatingCount = res.ratingCount;
            }
            this.snackBar.open('Thank you for rating your driver!', 'Close', { duration: 3500 });
          },
          error: (err) => {
            this.isSubmittingRating = false;
            this.snackBar.open(
              err?.error?.error || 'Could not submit rating. Please try again.',
              'Close',
              { duration: 3500 }
            );
          }
        });
      },
      error: () => {
        this.isSubmittingRating = false;
        this.snackBar.open('Could not submit rating. Please try again.', 'Close', { duration: 3500 });
      }
    });
  }

  voltarClientePage() {
    this.router.navigate(['/client']);
  }

  get taxiCarImage(): string {
    return getTaxiCarImage(this.taxiMarca, this.taxiModelo);
  }

  get clientSenderName(): string {
    return this.pedido?.client && typeof this.pedido.client === 'object'
      ? (this.pedido.client as any).name || 'Client'
      : 'Client';
  }

  shareTrip() {
    if (!this.pedidoId) return;
    this.pedidoViagemService.createShareLink(this.pedidoId).subscribe({
      next: ({ shareToken }) => {
        const shareUrl = `${window.location.origin}/share-trip/${shareToken}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            this.snackBar.open('Public share link copied! Expires when the trip ends.', 'Close', { duration: 4000 });
          }).catch(() => {
            window.prompt('Copy this public trip link:', shareUrl);
          });
        } else {
          window.prompt('Copy this public trip link:', shareUrl);
        }
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error || 'Could not generate share link.', 'Close', { duration: 3500 });
      }
    });
  }

}
