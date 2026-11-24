import { AfterViewInit, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { TaxiService } from '../../appServices/taxi.service';
import { DriverService } from '../../appServices/driver.service';
import { PriceService } from '../../appServices/price.service';
import { TripService } from '../../appServices/trip.service';
import { ShiftService } from '../../appServices/shift.service';
import { RideRequestService } from '../../appServices/ride-request.service';
import { FleetDriverLocation, SocketService } from '../../appServices/socket.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { AlertNotificationService } from '../../appServices/alert-notification.service';
import { Price } from '../../manage-prices/price.interface';
import { Shift } from '../../shifts/shift.interface';
import { RideRequest } from '../../client/ride-request.interface';

@Component({
  selector: 'app-gestor-page',
  templateUrl: './manager-page.component.html',
  styleUrls: ['./manager-page.component.css']
})
export class ManagerPageComponent implements OnInit, AfterViewInit, OnDestroy {
  taxis: any[] = [];
  drivers: any[] = [];
  trips: any[] = [];
  shifts: Shift[] = [];
  rideRequests: RideRequest[] = [];
  price: Price | null = null;
  resolvedAddresses: Record<string, string> = {};
  liveLocationsMap = new Map<string, FleetDriverLocation>();
  rideSearchTerm: string = '';
  selectedRideIds = new Set<string>();

  private fleetMap: L.Map | null = null;
  private fleetMarkers = new Map<string, L.Marker>();
  private subs = new Subscription();

  constructor(
    private taxiService: TaxiService,
    private motoristaService: DriverService,
    private precoService: PriceService,
    private viagemService: TripService,
    private shiftService: ShiftService,
    private rideRequestService: RideRequestService,
    private socketService: SocketService,
    private geolocationService: GeolocationService,
    private ngZone: NgZone,
    private alertService: AlertNotificationService
  ) {}

  ngOnInit(): void {
    this.loadTaxis();
    this.loadDrivers();
    this.loadPrice();
    this.loadTrips();
    this.refreshFleetData();
    this.bindSocketEvents();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initFleetMap();
    }, 60);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.fleetMap) {
      this.fleetMap.remove();
      this.fleetMap = null;
    }
    this.fleetMarkers.clear();
  }

  refreshFleetData(): void {
    this.loadShifts();
    this.loadRideRequests();
    this.socketService.requestFleetLocations();
  }

  private bindSocketEvents(): void {
    this.subs.add(
      this.socketService.onEvent<FleetDriverLocation[]>('fleet:locations').subscribe((list) => {
        this.ngZone.run(() => {
          this.liveLocationsMap.clear();
          if (Array.isArray(list)) {
            list.forEach((loc) => {
              if (loc && loc.pedidoId && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lon))) {
                this.liveLocationsMap.set(String(loc.pedidoId), {
                  pedidoId: String(loc.pedidoId),
                  lat: Number(loc.lat),
                  lon: Number(loc.lon),
                  heading: loc.heading || 0,
                  updatedAt: loc.updatedAt
                });
              }
            });
          }
          this.syncFleetMarkers();
        });
      })
    );

    this.subs.add(
      this.socketService.onEvent<FleetDriverLocation>('driver:location').subscribe((loc) => {
        this.ngZone.run(() => {
          if (loc && loc.pedidoId && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lon))) {
            this.liveLocationsMap.set(String(loc.pedidoId), {
              pedidoId: String(loc.pedidoId),
              lat: Number(loc.lat),
              lon: Number(loc.lon),
              heading: loc.heading || 0,
              updatedAt: Date.now()
            });
            this.syncFleetMarkers();
          }
        });
      })
    );

    const handleRideReload = () => {
      this.ngZone.run(() => {
        this.loadRideRequests();
      });
    };

    this.subs.add(
      this.socketService.onEvent<RideRequest>('pedido:created').subscribe(() => {
        this.ngZone.run(() => {
          this.loadRideRequests();
          this.alertService.notify({
            title: 'New Ride Request',
            body: 'A new taxi request appeared on the live fleet monitor.',
            sound: 'new-request',
            tag: 'manager-new-ride'
          });
        });
      })
    );
    this.subs.add(this.socketService.onEvent('pedido:updated').subscribe(handleRideReload));
    this.subs.add(this.socketService.onEvent('pedido:driverAccepted').subscribe(handleRideReload));
    this.subs.add(this.socketService.onEvent('pedido:clientConfirmed').subscribe(handleRideReload));
    this.subs.add(this.socketService.onEvent('pedido:clientRejected').subscribe(handleRideReload));

    this.subs.add(
      this.socketService.onEvent<{ id: string }>('pedido:deleted').subscribe((ev) => {
        this.ngZone.run(() => {
          if (ev?.id) {
            const idStr = String(ev.id);
            this.rideRequests = this.rideRequests.filter((r) => String(r._id) !== idStr);
            this.liveLocationsMap.delete(idStr);
            this.selectedRideIds.delete(idStr);
            this.syncFleetMarkers();
          }
        });
      })
    );

    this.subs.add(
      this.socketService.onEvent('connect').subscribe(() => {
        this.ngZone.run(() => {
          this.socketService.requestFleetLocations();
          this.loadRideRequests();
        });
      })
    );
  }

  private loadShifts(): void {
    this.shiftService.getShifts().subscribe({
      next: (data) => {
        this.shifts = data || [];
      },
      error: (err) => {
        console.error('Error fetching shifts:', err);
      }
    });
  }

  private loadRideRequests(): void {
    this.rideRequestService.getRideRequests().subscribe({
      next: (data) => {
        this.rideRequests = data || [];
        this.resolveActiveAddresses();
        this.syncFleetMarkers();
      },
      error: (err) => {
        console.error('Error fetching ride requests:', err);
      }
    });
  }

  private resolveActiveAddresses(): void {
    const rawSet = new Set<string>();
    this.activeRideRequests.forEach((r) => {
      if (r.entryAddress && !r.entryAddressLabel) rawSet.add(r.entryAddress);
      if (r.exitAddress && !r.exitAddressLabel) rawSet.add(r.exitAddress);
    });

    rawSet.forEach((raw) => {
      if (this.geolocationService.isCoordinateString(raw) && !this.resolvedAddresses[raw]) {
        void this.geolocationService.resolveDisplayAddress(raw).then((resolved) => {
          this.resolvedAddresses[raw] = resolved;
        });
      }
    });
  }

  private initFleetMap(): void {
    const mapEl = document.getElementById('managerFleetMap');
    if (!mapEl || this.fleetMap) return;

    this.fleetMap = L.map(mapEl, {
      center: [39.399872, -8.224454],
      zoom: 7
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.fleetMap);

    this.syncFleetMarkers();
    setTimeout(() => this.fleetMap?.invalidateSize(), 120);
  }

  private parseCoordPair(raw?: string | null): [number, number] | null {
    if (!raw || typeof raw !== 'string' || !raw.includes(',')) return null;
    const parts = raw.split(',').map((s) => s.trim());
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
  }

  private escapeHtml(val: unknown): string {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildMarkerIcon(hasLiveGps: boolean, isPending: boolean): L.DivIcon {
    if (hasLiveGps) {
      return L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.45));">🚕</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    }
    const color = isPending ? '#f59e0b' : '#2563eb';
    return L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  private buildMarkerPopupHtml(req: RideRequest, hasLiveGps: boolean): string {
    const status = this.escapeHtml(this.getRideStatusLabel(req));
    const driver = this.escapeHtml(this.getDriverName(req) || 'Unassigned');
    const taxi = this.escapeHtml(this.getTaxiInfo(req));
    const client = this.escapeHtml(this.getClientName(req));
    const pickup = this.escapeHtml(this.getDisplayAddress(req.entryAddress, req.entryAddressLabel));
    const dropoff = this.escapeHtml(this.getDisplayAddress(req.exitAddress, req.exitAddressLabel));
    const liveTag = hasLiveGps ? ' · LIVE GPS' : '';

    return `
      <div style="min-width:190px;font-family:Roboto,sans-serif;font-size:12.5px;line-height:1.4;">
        <div style="font-weight:700;color:#111827;margin-bottom:4px;">${status}${liveTag}</div>
        <div><strong>Driver:</strong> ${driver}</div>
        ${taxi ? `<div><strong>Taxi:</strong> ${taxi}</div>` : ''}
        <div><strong>Client:</strong> ${client}</div>
        <div style="margin-top:4px;color:#4b5563;">${pickup} → ${dropoff}</div>
      </div>
    `;
  }

  private syncFleetMarkers(): void {
    const activeIdsAll = new Set(
      this.activeRideRequests.filter((r) => Boolean(r._id)).map((r) => String(r._id))
    );
    for (const selectedId of Array.from(this.selectedRideIds)) {
      if (!activeIdsAll.has(selectedId)) {
        this.selectedRideIds.delete(selectedId);
      }
    }

    if (!this.fleetMap) return;

    const visibleIds = new Set<string>();
    for (const req of this.activeRideRequests) {
      if (!req._id) continue;
      const idStr = String(req._id);
      if (!this.selectedRideIds.has(idStr)) continue;

      const liveLoc = this.liveLocationsMap.get(idStr);
      const pickupCoords = this.parseCoordPair(req.entryAddress);
      const coords: [number, number] | null = liveLoc
        ? [liveLoc.lat, liveLoc.lon]
        : pickupCoords;

      if (!coords) continue;
      visibleIds.add(idStr);

      const isPending = !req.driverId;
      const hasLive = Boolean(liveLoc);
      const icon = this.buildMarkerIcon(hasLive, isPending);
      const popupHtml = this.buildMarkerPopupHtml(req, hasLive);

      const existing = this.fleetMarkers.get(idStr);
      if (existing) {
        existing.setLatLng(coords);
        existing.setIcon(icon);
        existing.setPopupContent(popupHtml);
      } else {
        const marker = L.marker(coords, { icon })
          .bindPopup(popupHtml)
          .addTo(this.fleetMap);
        this.fleetMarkers.set(idStr, marker);
      }
    }

    for (const [idStr, marker] of this.fleetMarkers.entries()) {
      if (!visibleIds.has(idStr)) {
        marker.remove();
        this.fleetMarkers.delete(idStr);
      }
    }
  }

  fitAllFleetMarkers(): void {
    if (!this.fleetMap || this.fleetMarkers.size === 0) return;
    const latLngs = Array.from(this.fleetMarkers.values()).map((m) => m.getLatLng());
    if (latLngs.length === 1) {
      this.fleetMap.setView(latLngs[0], 14, { animate: true });
    } else {
      this.fleetMap.fitBounds(L.latLngBounds(latLngs), { padding: [45, 45], maxZoom: 15, animate: true });
    }
  }

  isRideSelected(req: RideRequest): boolean {
    return Boolean(req._id && this.selectedRideIds.has(String(req._id)));
  }

  get selectedRidesCount(): number {
    return this.selectedRideIds.size;
  }

  toggleRideOnMap(req: RideRequest): void {
    if (!req._id) return;
    const idStr = String(req._id);

    if (this.selectedRideIds.has(idStr)) {
      this.selectedRideIds.delete(idStr);
      this.syncFleetMarkers();
      return;
    }

    this.selectedRideIds.add(idStr);
    this.syncFleetMarkers();

    if (!this.fleetMap) return;
    const liveLoc = this.liveLocationsMap.get(idStr);
    const coords: [number, number] | null = liveLoc
      ? [liveLoc.lat, liveLoc.lon]
      : this.parseCoordPair(req.entryAddress);
    if (!coords) return;

    this.fleetMap.flyTo(coords, 15, { duration: 0.6 });
    const marker = this.fleetMarkers.get(idStr);
    if (marker) {
      marker.openPopup();
    }
  }

  clearSelectedRides(): void {
    this.selectedRideIds.clear();
    this.syncFleetMarkers();
  }

  private loadTaxis(): void {
    this.taxiService.getTaxis().subscribe({
      next: (data) => {
        this.taxis = data || [];
      },
      error: (err) => {
        console.error('Error fetching taxis:', err);
      }
    });
  }

  private loadDrivers(): void {
    this.motoristaService.getDrivers().subscribe({
      next: (data) => {
        this.drivers = data || [];
      },
      error: (err) => {
        console.error('Error fetching drivers:', err);
      }
    });
  }

  private loadPrice(): void {
    this.precoService.getPrice().subscribe({
      next: (data) => {
        this.price = data;
      },
      error: (err) => {
        console.error('Error fetching prices:', err);
      }
    });
  }

  private loadTrips(): void {
    this.viagemService.getAllTrips().subscribe({
      next: (data: any[]) => {
        this.trips = data || [];
      },
      error: (err: any) => {
        console.error('Error fetching trips:', err);
      }
    });
  }

  get totalTaxis(): number {
    return this.taxis.length;
  }

  get basicTaxis(): number {
    return this.taxis.filter(t => t.confort === 'Basic').length;
  }

  get luxuryTaxis(): number {
    return this.taxis.filter(t => t.confort === 'Luxury').length;
  }

  get totalDrivers(): number {
    return this.drivers.length;
  }

  get totalTrips(): number {
    return this.trips.length;
  }

  get activeRideRequests(): RideRequest[] {
    return this.rideRequests.filter((r) => !r.endTime);
  }

  private normalizeSearch(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  get filteredActiveRides(): RideRequest[] {
    const query = this.normalizeSearch(this.rideSearchTerm.trim());
    if (!query) return this.activeRideRequests;

    return this.activeRideRequests.filter((req) => {
      const driverName = this.getDriverName(req);
      const driverNif = this.getDriverNif(req);
      const clientName = this.getClientName(req);
      const taxiInfo = this.getTaxiInfo(req);
      const status = this.getRideStatusLabel(req);
      const haystack = this.normalizeSearch(
        `${driverName} ${driverNif} ${clientName} ${taxiInfo} ${status}`
      );
      return haystack.includes(query);
    });
  }

  get activeShiftsCount(): number {
    const now = Date.now();
    return this.shifts.filter((s) => {
      const start = new Date(s.start).getTime();
      const end = new Date(s.end).getTime();
      return start <= now && now <= end;
    }).length;
  }

  get pendingRequestsCount(): number {
    return this.activeRideRequests.filter((r) => !r.driverId).length;
  }

  get enRouteRequestsCount(): number {
    return this.activeRideRequests.filter((r) => Boolean(r.driverId) && !r.startTime).length;
  }

  get inProgressRequestsCount(): number {
    return this.activeRideRequests.filter((r) => Boolean(r.startTime) && !r.endTime).length;
  }

  get liveTrackedCount(): number {
    return this.activeRideRequests.filter((r) => r._id && this.liveLocationsMap.has(String(r._id))).length;
  }

  hasLiveGps(req: RideRequest): boolean {
    return Boolean(req._id && this.liveLocationsMap.has(String(req._id)));
  }

  getDriverName(req: RideRequest): string {
    if (!req.driverId) return '';
    const match = this.drivers.find((d) => String(d._id) === String(req.driverId));
    return match?.name || 'Assigned Driver';
  }

  getDriverNif(req: RideRequest): string {
    if (!req.driverId) return '';
    const match = this.drivers.find((d) => String(d._id) === String(req.driverId));
    return match?.NIF || '';
  }

  getTaxiInfo(req: RideRequest): string {
    if (!req.taxi) return '';
    const match = this.taxis.find((t) => String(t._id) === String(req.taxi));
    if (!match) return '';
    return `${match.brand} ${match.model} · ${match.licensePlate}`;
  }

  getClientName(req: RideRequest): string {
    if (req.client && typeof req.client === 'object') {
      return (req.client as any).name || 'Client';
    }
    return 'Client';
  }

  getRideStatusLabel(req: RideRequest): string {
    if (!req.driverId) return 'Pending';
    if (!req.startTime) return 'Driver En Route';
    return 'In Progress';
  }

  getRideStatusClass(req: RideRequest): string {
    if (!req.driverId) return 'pending';
    if (!req.startTime) return 'en-route';
    return 'in-progress';
  }

  getDisplayAddress(raw?: string, label?: string): string {
    if (label) return label;
    if (!raw) return '';
    return this.resolvedAddresses[raw] || raw;
  }
}
