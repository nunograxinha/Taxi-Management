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
    private alertService: AlertNotificationService
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
            this.loadPendingRequests();
          }
        },
        error: (err) => {
          console.error('Error getting current position:', err);
          console.log('Using default position (FCUL)');
        }
      });

      this.motoristaService.getDriverByNIF(this.driverNIF).subscribe({
        next: (driver) => {
          this.driver = driver;
          this.loadCurrentShift();
        },
        error: (err) => {
          console.error('Error getting driver:', err);
        }
      });

      this.prices = await firstValueFrom(this.precoService.getPrice()) || null;
    } catch (error) {
      console.error('Error in loadData:', error);
      this.errorMessage = 'Error loading required data';
      this.loading = false;
    }
  }

  async loadCurrentShift() {
    try {
      const now = new Date();
      const shifts = await firstValueFrom(this.turnoService.getShifts()) || [];

      this.currentShift = shifts.find(shift => {
        const start = new Date(shift.start);
        const end = new Date(shift.end);
        return shift.driver === this.driver?._id && now >= start && now <= end;
      }) || null;

      if (this.currentShift) {
        this.taxiService.getTaxiById(this.currentShift.taxi).subscribe({
          next: (taxi) => {
            this.taxi = taxi;
            this.loadPendingRequests();
          },
          error: (err) => {
            console.error('Error getting taxi id:', err);
            this.loading = false;
          }
        });
      } else {
        this.loading = false;
      }
    } catch (error) {
      console.error('Error in loadCurrentShift:', error);
    }
  }

  async loadPendingRequests() {
    try {
      this.clientAddresses.clear();
      this.destinationAddresses.clear();
      this.clientDistances.clear();
      this.arrivalTimes.clear();
      this.tripDistances.clear();
      this.tripTimes.clear();
      this.totalTimes.clear();

      const requests = await firstValueFrom(this.pedidoViagemService.getRideRequests()) || [];

      const myActiveRequest = requests.find(r => r.driverId === this.driver?._id);
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

      let filteredRequests = requests.filter(request =>
        !request.driverId && !(request.rejectedDrivers && request.rejectedDrivers.includes(this.driver?._id))
      );

      for (const request of filteredRequests) {
        try {
          const taxiCapacity = Number(this.taxi.passengerCapacity) || 4;
          if (request.confort !== this.taxi.confort || request.numberOfPeople > taxiCapacity || !request._id || !request.entryAddress || !request.exitAddress) continue;

          const [clientLat, clientLng] = request.entryAddress.split(',').map(coord => parseFloat(coord));
          const [destLat, destLng] = request.exitAddress.split(',').map(coord => parseFloat(coord));

          const distanceToClient = this.pedidoViagemService.calculateDistance(
            this.currentPosition.latitude,
            this.currentPosition.longitude,
            clientLat,
            clientLng
          );

          const tripDistance = this.pedidoViagemService.calculateDistance(
            clientLat,
            clientLng,
            destLat,
            destLng
          );

          const timeToReachClient = Math.ceil(distanceToClient * 4);
          const tripTime = Math.ceil(tripDistance * 4);
          const totalTime = timeToReachClient + tripTime;

          this.clientDistances.set(request._id, distanceToClient);
          this.arrivalTimes.set(request._id, timeToReachClient);
          this.tripDistances.set(request._id, tripDistance);
          this.tripTimes.set(request._id, tripTime);
          this.totalTimes.set(request._id, totalTime);

          try {
            const clientAddress = await this.geolocationService.getAddressFromCoordinates(
              clientLat.toString(),
              clientLng.toString()
            );
            if (request._id && clientAddress) {
              this.clientAddresses.set(request._id, clientAddress);
            }

            const destinationAddress = await this.geolocationService.getAddressFromCoordinates(
              destLat.toString(),
              destLng.toString()
            );
            if (destinationAddress !== null) {
              this.destinationAddresses.set(request._id, destinationAddress ?? 'Address not available');
            }
          } catch (addressError) {
            console.error('Error getting address:', addressError);
          }
        } catch (err) {
          console.error(`Error processing request ${request._id}:`, err);
        }
      }

      if (this.currentShift) {
        const now = new Date();
        const shiftEnd = new Date(this.currentShift.end);
        const remainingMinutes = Math.floor((shiftEnd.getTime() - now.getTime()) / 60000);

        filteredRequests = filteredRequests.filter(request =>
          request._id && this.totalTimes.get(request._id) !== undefined &&
          (this.totalTimes.get(request._id) || 0) <= remainingMinutes
        );
      }

      this.pendingRequests = filteredRequests.sort((a, b) => {
        const distA = a._id ? (this.clientDistances.get(a._id) || 0) : 0;
        const distB = b._id ? (this.clientDistances.get(b._id) || 0) : 0;
        return distA - distB;
      });

      const nextIds = new Set(
        this.pendingRequests.map((r) => String(r._id || '')).filter(Boolean)
      );
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
    } catch (error) {
      console.error('Error in loadPendingRequests:', error);
      this.errorMessage = 'Error loading pending ride requests';
      this.loading = false;
    }
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
    return this.clientAddresses.get(requestId) || 'Address not available';
  }

  getDestinationAddress(requestId: string): string {
    return this.destinationAddresses.get(requestId) || 'Address not available';
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
