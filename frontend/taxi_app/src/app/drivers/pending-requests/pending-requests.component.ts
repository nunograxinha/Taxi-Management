import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, Subscription } from 'rxjs';
import { RideRequestService } from '../../appServices/ride-request.service';
import { SocketService } from '../../appServices/socket.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { DriverService } from '../../appServices/driver.service';
import { TaxiService } from '../../appServices/taxi.service';
import { PriceService } from '../../appServices/price.service';
import { RideRequest } from '../../client/ride-request.interface';
import { Price } from '../../manage-prices/price.interface';
import { Shift } from '../../shifts/shift.interface';
import { ShiftService } from '../../appServices/shift.service';
import { AuthService } from '../../appServices/auth.service';
import { AlertNotificationService } from '../../appServices/alert-notification.service';
import { RouteEstimateService } from '../../appServices/route-estimate.service';

@Component({
  selector: 'app-pedidos-pendentes',
  templateUrl: './pending-requests.component.html',
  styleUrls: ['./pending-requests.component.css']
})
export class PendingRequestsComponent implements OnInit, OnDestroy {
  driverNIF: string = '';
  driver: any;
  taxi: any;
  pendingRequests: RideRequest[] = [];
  loading = true;
  errorMessage = '';
  currentPosition: { latitude: number, longitude: number } = { latitude: 38.756734, longitude: -9.155412 }; // Default to FCUL
  prices: Price | null = null;
  currentShift: Shift | null = null;
  clientAddresses: Map<string, string> = new Map();
  destinationAddresses: Map<string, string> = new Map();
  clientDistances: Map<string, number> = new Map();
  arrivalTimes: Map<string, number> = new Map();
  tripDistances: Map<string, number> = new Map();
  tripTimes: Map<string, number> = new Map();
  totalTimes: Map<string, number> = new Map();
  private subscriptions = new Subscription();
  private activeRequestId: string | null = null;
  private knownPendingIds = new Set<string>();
  private hasLoadedInitialRequests = false;
  private loadSeq = 0;
  private osrmEnrichSeq = 0;
  private lastRequests: RideRequest[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoViagemService: RideRequestService,
    private motoristaService: DriverService,
    private taxiService: TaxiService,
    private geolocationService: GeolocationService,
    private precoService: PriceService,
    private turnoService: ShiftService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private alertService: AlertNotificationService,
    private routeEstimateService: RouteEstimateService
  ) { }

  ngOnInit() {
    const url = this.router.url;
    const nif =
      this.authService.getDriverNif() ||
      this.motoristaService.getDriver()?.NIF ||
      this.route.snapshot.paramMap.get('nif') ||
      this.route.parent?.snapshot.paramMap.get('nif') ||
      url.match(/\/(?:driver|motorista)\/(\d+)\//)?.[1];

    if (nif) {
      this.driverNIF = nif;
      this.loadData();
      this.setupSocketListeners();
    } else {
      console.error('Driver NIF not found in URL.');
      this.errorMessage = 'Error loading driver data. NIF not found.';
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.activeRequestId) {
      this.socketService.leavePedido(this.activeRequestId);
    }
    this.subscriptions.unsubscribe();
  }

  private setupSocketListeners() {
    this.subscriptions.add(
      this.socketService.onEvent<RideRequest>('pedido:created').subscribe(() => {
        if (this.currentShift && this.taxi) {
          this.loadPendingRequests();
        }
      })
    );

    this.subscriptions.add(
      this.socketService.onEvent<RideRequest>('pedido:updated').subscribe(() => {
        if (this.currentShift && this.taxi) {
          this.loadPendingRequests();
        }
      })
    );

    this.subscriptions.add(
      this.socketService.onEvent<{ id: string }>('pedido:deleted').subscribe((data) => {
        if (this.activeRequestId && data?.id === this.activeRequestId) {
          this.alertService.notify({
            title: 'Ride Request Cancelled',
            body: 'The client cancelled the ride request.',
            sound: 'warning',
            tag: 'driver-cancelled'
          });
          this.snackBar.open('The client cancelled the request.', 'Close', { duration: 4000 });
          this.socketService.leavePedido(this.activeRequestId);
          this.activeRequestId = null;
        }
        if (this.currentShift && this.taxi) {
          this.loadPendingRequests();
        }
      })
    );

    this.subscriptions.add(
      this.socketService.onEvent<RideRequest>('pedido:clientConfirmed').subscribe((confirmedRequest) => {
        if (confirmedRequest && confirmedRequest._id) {
          this.alertService.notify({
            title: 'Ride Confirmed!',
            body: 'The passenger confirmed your taxi. Starting navigation.',
            sound: 'accepted',
            tag: `driver-confirmed-${confirmedRequest._id}`
          });
          this.router.navigate([`/driver/accepted-request/${confirmedRequest._id}`]);
        }
      })
    );

    this.subscriptions.add(
      this.socketService.onEvent<RideRequest>('pedido:clientRejected').subscribe(() => {
        this.alertService.notify({
          title: 'Ride Request Cancelled',
          body: 'The client rejected or cancelled the ride request.',
          sound: 'warning',
          tag: 'driver-cancelled'
        });
        this.snackBar.open('The client rejected or cancelled the request.', 'Close', { duration: 4000 });
        if (this.activeRequestId) {
          this.socketService.leavePedido(this.activeRequestId);
          this.activeRequestId = null;
        }
        this.loadPendingRequests();
      })
    );
  }

  async loadData() {
    try {
      this.geolocationService.getCurrentPosition().subscribe({
        next: (position) => {
          this.currentPosition = {
            latitude: parseFloat(position.latitude),
            longitude: parseFloat(position.longitude)
          };
          if (this.currentShift && this.taxi) {
            if (this.lastRequests.length > 0) {
              this.applyPendingRequests(this.lastRequests);
            } else {
              this.loadPendingRequests();
            }
          }
        },
        error: () => {
          // Keep default position (FCUL) when geolocation is unavailable or slow
        }
      });

      const cachedDriver = this.motoristaService.getDriver();
      const driverPromise =
        cachedDriver && cachedDriver.NIF === this.driverNIF
          ? Promise.resolve(cachedDriver)
          : firstValueFrom(this.motoristaService.getDriverByNIF(this.driverNIF));

      const [driver, shifts, prices] = await Promise.all([
        driverPromise,
        firstValueFrom(this.turnoService.getShiftsByDriverNIF(this.driverNIF)).catch(() => [] as Shift[]),
        firstValueFrom(this.precoService.getPrice()).catch(() => null)
      ]);

      this.driver = driver;
      this.prices = prices || null;

      const now = new Date();
      this.currentShift =
        (shifts || []).find((shift) => {
          const start = new Date(shift.start);
          const end = new Date(shift.end);
          return (!this.driver?._id || shift.driver === this.driver._id) && now >= start && now <= end;
        }) || null;

      if (this.currentShift) {
        this.taxi = await firstValueFrom(this.taxiService.getTaxiById(this.currentShift.taxi));
        await this.loadPendingRequests();
      } else {
        this.loading = false;
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      this.errorMessage = 'Error loading required data';
      this.loading = false;
    }
  }

  async loadPendingRequests() {
    if (!this.taxi || !this.driver) {
      this.loading = false;
      return;
    }

    const seq = ++this.loadSeq;
    try {
      const requests = (await firstValueFrom(this.pedidoViagemService.getRideRequests())) || [];
      if (seq !== this.loadSeq) {
        return;
      }
      this.lastRequests = requests;
      this.applyPendingRequests(requests);
    } catch (error) {
      if (seq !== this.loadSeq) {
        return;
      }
      console.error('Error in loadPendingRequests:', error);
      this.errorMessage = 'Error loading pending ride requests';
      this.loading = false;
    }
  }

  private applyPendingRequests(requests: RideRequest[]): void {
    const myActiveRequest = requests.find((r) => r.driverId === this.driver?._id);
    if (myActiveRequest && myActiveRequest._id) {
      if (myActiveRequest.clientAccepted) {
        this.router.navigate([`/driver/accepted-request/${myActiveRequest._id}`]);
        return;
      }
      this.activeRequestId = myActiveRequest._id;
      this.socketService.joinPedido(myActiveRequest._id);
      this.loading = false;
      return;
    }

    const nextClientDistances = new Map<string, number>();
    const nextArrivalTimes = new Map<string, number>();
    const nextTripDistances = new Map<string, number>();
    const nextTripTimes = new Map<string, number>();
    const nextTotalTimes = new Map<string, number>();

    const taxiCapacity = Number(this.taxi.passengerCapacity) || 4;
    const driverPos: [number, number] = [this.currentPosition.latitude, this.currentPosition.longitude];
    let filteredRequests = requests.filter(
      (request) =>
        !request.driverId && !(request.rejectedDrivers && request.rejectedDrivers.includes(this.driver?._id))
    );

    for (const request of filteredRequests) {
      if (
        request.confort !== this.taxi.confort ||
        request.numberOfPeople > taxiCapacity ||
        !request._id
      ) {
        continue;
      }

      const pickup = this.routeEstimateService.parseCoords(request.entryAddress);
      const dest = this.routeEstimateService.parseCoords(request.exitAddress);
      if (!pickup || !dest) {
        continue;
      }

      const approachEst = this.routeEstimateService.estimateFallback(driverPos, pickup, { allowZero: true });
      const tripEst = this.routeEstimateService.estimateFallback(pickup, dest);
      const totalTime = approachEst.durationMin + tripEst.durationMin;

      nextClientDistances.set(request._id, approachEst.distanceKm);
      nextArrivalTimes.set(request._id, approachEst.durationMin);
      nextTripDistances.set(request._id, tripEst.distanceKm);
      nextTripTimes.set(request._id, tripEst.durationMin);
      nextTotalTimes.set(request._id, totalTime);
    }

    if (this.currentShift) {
      const now = new Date();
      const shiftEnd = new Date(this.currentShift.end);
      const remainingMinutes = Math.floor((shiftEnd.getTime() - now.getTime()) / 60000);

      filteredRequests = filteredRequests.filter(
        (request) =>
          request._id &&
          nextTotalTimes.get(request._id) !== undefined &&
          (nextTotalTimes.get(request._id) || 0) <= remainingMinutes
      );
    }

    this.clientDistances = nextClientDistances;
    this.arrivalTimes = nextArrivalTimes;
    this.tripDistances = nextTripDistances;
    this.tripTimes = nextTripTimes;
    this.totalTimes = nextTotalTimes;

    this.pendingRequests = filteredRequests.sort((a, b) => {
      const distA = a._id ? this.clientDistances.get(a._id) || 0 : 0;
      const distB = b._id ? this.clientDistances.get(b._id) || 0 : 0;
      return distA - distB;
    });

    const nextIds = new Set(this.pendingRequests.map((r) => String(r._id || '')).filter(Boolean));
    if (this.hasLoadedInitialRequests) {
      const newCount = Array.from(nextIds).filter((id) => !this.knownPendingIds.has(id)).length;
      if (newCount > 0) {
        this.alertService.notify({
          title: 'New Ride Request',
          body:
            newCount === 1
              ? 'A new ride request is available nearby.'
              : `${newCount} new ride requests are available.`,
          sound: 'new-request',
          tag: 'driver-new-request'
        });
      }
    }
    this.knownPendingIds = nextIds;
    this.hasLoadedInitialRequests = true;
    this.loading = false;

    void this.enrichPendingRequestsWithOsrm(this.pendingRequests, driverPos, ++this.osrmEnrichSeq);

    for (const request of this.pendingRequests) {
      if (!request._id) continue;
      const requestId = request._id;

      if (request.entryAddressLabel) {
        this.clientAddresses.set(requestId, request.entryAddressLabel);
      } else if (!this.clientAddresses.has(requestId) && request.entryAddress) {
        void this.geolocationService.resolveDisplayAddress(request.entryAddress).then((addr) => {
          if (addr) {
            this.clientAddresses.set(requestId, addr);
          }
        });
      }

      if (request.exitAddressLabel) {
        this.destinationAddresses.set(requestId, request.exitAddressLabel);
      } else if (!this.destinationAddresses.has(requestId) && request.exitAddress) {
        void this.geolocationService.resolveDisplayAddress(request.exitAddress).then((addr) => {
          if (addr) {
            this.destinationAddresses.set(requestId, addr);
          }
        });
      }
    }
  }

  private async enrichPendingRequestsWithOsrm(
    requests: RideRequest[],
    driverPos: [number, number],
    enrichSeq: number
  ): Promise<void> {
    await Promise.all(
      requests.map(async (request) => {
        if (!request._id) return;
        const pickup = this.routeEstimateService.parseCoords(request.entryAddress);
        const dest = this.routeEstimateService.parseCoords(request.exitAddress);
        if (!pickup || !dest) return;

        const [approachEst, tripEst] = await Promise.all([
          this.routeEstimateService.getRouteEstimate(driverPos, pickup, { allowZero: true }),
          this.routeEstimateService.getRouteEstimate(pickup, dest)
        ]);

        if (enrichSeq !== this.osrmEnrichSeq) return;

        const id = request._id;
        const totalTime = approachEst.durationMin + tripEst.durationMin;
        this.clientDistances.set(id, approachEst.distanceKm);
        this.arrivalTimes.set(id, approachEst.durationMin);
        this.tripDistances.set(id, tripEst.distanceKm);
        this.tripTimes.set(id, tripEst.durationMin);
        this.totalTimes.set(id, totalTime);

        if (this.currentShift) {
          const remainingMinutes = Math.floor(
            (new Date(this.currentShift.end).getTime() - Date.now()) / 60000
          );
          this.pendingRequests = this.pendingRequests.filter(
            (r) => r._id && (this.totalTimes.get(r._id) || 0) <= remainingMinutes
          );
        }

        this.pendingRequests = [...this.pendingRequests].sort((a, b) => {
          const distA = a._id ? this.clientDistances.get(a._id) || 0 : 0;
          const distB = b._id ? this.clientDistances.get(b._id) || 0 : 0;
          return distA - distB;
        });
      })
    );
  }

  async onAcceptRequest(request: RideRequest) {
    try {
      if (!request._id || !this.driver || !this.prices) {
        throw new Error('Driver or pricing data not available');
      }

      const distanceKmToDriver = this.clientDistances.get(request._id) || 0;

      this.pedidoViagemService.acceptDriver(
        request._id,
        this.driver?._id,
        this.taxi?._id,
        distanceKmToDriver
      ).subscribe({
        next: () => {
          this.activeRequestId = request._id!;
          this.socketService.joinPedido(request._id!);
          this.snackBar.open('Request accepted! Waiting for client confirmation.', 'Close', { duration: 4000 });
        },
        error: (err) => {
          console.error('Error while accepting ride request:', err);
          this.snackBar.open('Error accepting the request. Please try again.', 'Close', { duration: 4000 });
        }
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      this.snackBar.open('Error accepting the request. Please try again.', 'Close', { duration: 4000 });
    }
  }

  getClientDistance(requestId: string): number {
    return this.clientDistances.get(requestId) || 0;
  }

  getArrivalTime(requestId: string): number {
    return this.arrivalTimes.get(requestId) || 0;
  }

  getTripDistance(requestId: string): number {
    return this.tripDistances.get(requestId) || 0;
  }

  getTripTime(requestId: string): number {
    return this.tripTimes.get(requestId) || 0;
  }

  getTotalTime(requestId: string): number {
    return this.totalTimes.get(requestId) || 0;
  }

  getClientAddress(requestId: string): string {
    return this.clientAddresses.get(requestId) || 'Resolving address...';
  }

  getDestinationAddress(requestId: string): string {
    return this.destinationAddresses.get(requestId) || 'Resolving address...';
  }

  getClientName(request: RideRequest): string {
    if (request.client && typeof request.client === 'object') {
      return request.client.name || '';
    }
    return '';
  }

  getClientPhoto(request: RideRequest): string | null {
    if (request.client && typeof request.client === 'object') {
      return request.client.profilePhoto || null;
    }
    return null;
  }

  get hasActiveShift(): boolean {
    return this.currentShift !== null;
  }

  get isWaitingClient(): boolean {
    return !!this.activeRequestId;
  }

  cancelPendingAcceptance() {
    if (!this.activeRequestId) return;
    const requestId = this.activeRequestId;
    this.pedidoViagemService.rejectDriver(requestId, this.driver?._id).subscribe({
      next: () => {
        this.socketService.leavePedido(requestId);
        this.activeRequestId = null;
        this.snackBar.open('Acceptance cancelled. You can choose another ride.', 'Close', { duration: 3500 });
        this.loadPendingRequests();
      },
      error: (err) => {
        console.error('Error cancelling acceptance:', err);
        this.snackBar.open('Error cancelling acceptance. Please try again.', 'Close', { duration: 4000 });
      }
    });
  }

  get remainingShiftMinutes(): number {
    if (!this.currentShift) return 0;

    const now = new Date();
    const shiftEnd = new Date(this.currentShift.end);
    return Math.floor((shiftEnd.getTime() - now.getTime()) / 60000);
  }

  goBack() {
    if (this.driverNIF) {
      this.router.navigate([`/motorista/${this.driverNIF}`]);
    } else {
      console.error('Driver NIF is not available.');
      this.snackBar.open('Error returning to previous page. NIF not found.', 'Close', { duration: 4000 });
      this.router.navigate(['/driver']);
    }
  }
}
