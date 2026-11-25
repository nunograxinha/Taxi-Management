import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Client } from '../client.interface';
import { RideRequest } from '../ride-request.interface';
import { TripService } from '../../appServices/trip.service';
import { RideRequestService } from '../../appServices/ride-request.service';
import { SocketService } from '../../appServices/socket.service';
import { TaxiService } from '../../appServices/taxi.service';
import { Trip } from '../../trips/trip.interface';
import { Taxi } from '../../taxis/taxi.interface';
import { GeolocationService } from '../../appServices/geolocation.service';
import { AuthService } from '../../appServices/auth.service';
import { ClientService } from '../../appServices/client.service';
import { getTaxiCarImage } from '../../appServices/taxi-icon.util';

const CLIENT_STORAGE_KEY = 'clienteAtual';

@Component({
  selector: 'app-cliente-page',
  templateUrl: './client-page.component.html',
  styleUrls: ['./client-page.component.css']
})
export class ClientPageComponent implements OnInit, OnDestroy {
  clienteSelecionado: Client | null = null;
  activeTab: 'request' | 'history' = 'request';
  tripHistory: Trip[] = [];
  resolvedAddresses: Record<string, string> = {};
  isLoadingHistory: boolean = false;
  historyError: string = '';
  activeRideRequest: RideRequest | null = null;
  selectedReceiptTrip: Trip | null = null;
  receiptTaxi: Taxi | null = null;
  ratingModalTrip: Trip | null = null;
  selectedRating: number = 0;
  hoverRating: number = 0;
  ratingComment: string = '';
  isSubmittingRating: boolean = false;
  showPhotoModal: boolean = false;
  draftPhoto: string | null = null;
  photoError: string = '';
  isUpdatingPhoto: boolean = false;
  readonly starValues: number[] = [1, 2, 3, 4, 5];
  private taxiCache = new Map<string, Taxi>();
  private socketSub = new Subscription();

  constructor(
    private viagemService: TripService,
    private pedidoViagemService: RideRequestService,
    private socketService: SocketService,
    private taxiService: TaxiService,
    private geolocationService: GeolocationService,
    private authService: AuthService,
    private clientService: ClientService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated('client')) {
      localStorage.removeItem(CLIENT_STORAGE_KEY);
      return;
    }
    const savedClient = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (savedClient) {
      try {
        this.clienteSelecionado = JSON.parse(savedClient);
        this.loadActiveRideRequest();
        if (this.clienteSelecionado?._id) {
          this.clientService.getClient(this.clienteSelecionado._id).subscribe({
            next: (fresh) => {
              if (fresh && this.clienteSelecionado && String(fresh._id) === String(this.clienteSelecionado._id)) {
                this.clienteSelecionado = {
                  ...this.clienteSelecionado,
                  profilePhoto: fresh.profilePhoto || null
                };
                localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(this.clienteSelecionado));
              }
            },
            error: () => {}
          });
        }
      } catch {
        localStorage.removeItem(CLIENT_STORAGE_KEY);
      }
    }

    const handleRideUpdate = (updated: RideRequest) => {
      if (!updated || !this.clienteSelecionado?._id) return;
      const reqClientId =
        typeof updated.client === 'object' && updated.client !== null
          ? (updated.client as any)._id
          : updated.client;
      if (
        String(reqClientId) === String(this.clienteSelecionado._id) ||
        (this.activeRideRequest?._id && String(updated._id) === String(this.activeRideRequest._id))
      ) {
        this.activeRideRequest = updated;
        this.resolveTripAddresses([updated]);
      }
    };

    this.socketSub.add(this.socketService.onEvent<RideRequest>('pedido:updated').subscribe(handleRideUpdate));
    this.socketSub.add(this.socketService.onEvent<RideRequest>('pedido:driverAccepted').subscribe(handleRideUpdate));
    this.socketSub.add(
      this.socketService.onEvent<{ id: string }>('pedido:deleted').subscribe((ev) => {
        if (ev && this.activeRideRequest?._id && String(ev.id) === String(this.activeRideRequest._id)) {
          this.activeRideRequest = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.socketSub.unsubscribe();
  }

  onClienteCriado(cliente: Client) {
    this.clienteSelecionado = cliente;
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(cliente));
    this.loadActiveRideRequest();
  }

  trocarCliente() {
    this.clienteSelecionado = null;
    this.activeTab = 'request';
    this.tripHistory = [];
    this.activeRideRequest = null;
    this.selectedReceiptTrip = null;
    this.receiptTaxi = null;
    this.ratingModalTrip = null;
    localStorage.removeItem(CLIENT_STORAGE_KEY);
    if (this.authService.getRole() === 'client') {
      this.authService.logout();
    }
  }

  setTab(tab: 'request' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadTripHistory();
    }
  }

  loadTripHistory(): void {
    if (!this.clienteSelecionado?._id) return;
    this.isLoadingHistory = true;
    this.historyError = '';

    this.viagemService.getAllTrips().subscribe({
      next: (trips) => {
        const clientId = String(this.clienteSelecionado?._id);
        this.tripHistory = (trips || [])
          .filter(t => {
            const tripClientId = typeof t.client === 'object' && t.client !== null
              ? (t.client as any)._id
              : t.client;
            return String(tripClientId) === clientId;
          })
          .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
        this.resolveTripAddresses(this.tripHistory);
        this.isLoadingHistory = false;
      },
      error: (err) => {
        if (err?.status === 404) {
          this.tripHistory = [];
        } else {
          this.historyError = 'Could not load trip history. Please try again.';
        }
        this.isLoadingHistory = false;
      }
    });
  }

  formatAddress(raw: string): string {
    return this.resolvedAddresses[raw] || raw;
  }

  isSameDay(a: Date | string, b: Date | string): boolean {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  loadActiveRideRequest(): void {
    const clientId = this.clienteSelecionado?._id;
    if (!clientId) {
      this.activeRideRequest = null;
      return;
    }

    this.pedidoViagemService.getRideRequests().subscribe({
      next: (requests) => {
        const strClientId = String(clientId);
        const match = (requests || []).find((r) => {
          const reqClientId =
            typeof r.client === 'object' && r.client !== null
              ? (r.client as any)._id
              : r.client;
          return String(reqClientId) === strClientId;
        });
        this.activeRideRequest = match || null;
        if (match) {
          this.resolveTripAddresses([match]);
        }
      },
      error: () => {}
    });
  }

  getActiveRideStatusText(): string {
    const req = this.activeRideRequest;
    if (!req) return '';
    if (!req.driverId) return 'Waiting for a driver to accept';
    if (!req.clientAccepted) return 'Driver found — confirmation needed';
    if (!req.startTime) return 'Driver is on the way';
    if (!req.endTime) return 'Trip in progress';
    return 'Trip completed — view summary';
  }

  getActiveRideButtonText(): string {
    const req = this.activeRideRequest;
    if (!req) return '';
    if (!req.driverId) return 'View Request';
    if (!req.clientAccepted) return 'Confirm Driver';
    if (!req.endTime) return 'Track Live Trip';
    return 'View Summary';
  }

  goToActiveRide(): void {
    const req = this.activeRideRequest;
    if (!req?._id) return;
    if (!req.driverId) {
      this.router.navigate(['/client/waiting-response', req._id]);
    } else if (!req.clientAccepted) {
      this.router.navigate(['/client/confirm-trip', req._id]);
    } else {
      this.router.navigate(['/client/track-trip', req._id]);
    }
  }

  private resolveTripAddresses(
    trips: Array<{ entryAddress?: string; exitAddress?: string; entryAddressLabel?: string; exitAddressLabel?: string }>
  ): void {
    const rawSet = new Set<string>();
    trips.forEach(t => {
      if (t.entryAddress && !t.entryAddressLabel) rawSet.add(t.entryAddress);
      if (t.exitAddress && !t.exitAddressLabel) rawSet.add(t.exitAddress);
    });

    rawSet.forEach(raw => {
      if (this.geolocationService.isCoordinateString(raw) && !this.resolvedAddresses[raw]) {
        this.geolocationService.resolveDisplayAddress(raw).then(resolved => {
          this.resolvedAddresses[raw] = resolved;
        });
      }
    });
  }

  openReceipt(trip: Trip): void {
    this.selectedReceiptTrip = trip;
    this.receiptTaxi = null;
    const rawTaxi = (trip.shift as any)?.taxi;
    const taxiId = typeof rawTaxi === 'object' && rawTaxi !== null ? rawTaxi._id : rawTaxi;
    if (!taxiId) return;

    const strTaxiId = String(taxiId);
    const cached = this.taxiCache.get(strTaxiId);
    if (cached) {
      this.receiptTaxi = cached;
      return;
    }

    this.taxiService.getTaxiById(strTaxiId).subscribe({
      next: (taxi) => {
        if (taxi) {
          this.taxiCache.set(strTaxiId, taxi);
          if (this.selectedReceiptTrip === trip) {
            this.receiptTaxi = taxi;
          }
        }
      },
      error: () => {}
    });
  }

  closeReceipt(): void {
    this.selectedReceiptTrip = null;
    this.receiptTaxi = null;
  }

  openRateModal(trip: Trip): void {
    this.ratingModalTrip = trip;
    this.selectedRating = 0;
    this.hoverRating = 0;
    this.ratingComment = '';
    this.isSubmittingRating = false;
  }

  closeRateModal(): void {
    if (!this.isSubmittingRating) {
      this.ratingModalTrip = null;
    }
  }

  setModalRating(stars: number): void {
    if (!this.isSubmittingRating) {
      this.selectedRating = stars;
    }
  }

  submitTripRating(): void {
    if (!this.ratingModalTrip?._id || this.selectedRating < 1 || this.isSubmittingRating) {
      return;
    }
    this.isSubmittingRating = true;
    const comment = this.ratingComment.trim().slice(0, 500);
    const targetTrip = this.ratingModalTrip;

    this.viagemService.rateTrip(targetTrip._id!, this.selectedRating, comment).subscribe({
      next: (res) => {
        targetTrip.rating = this.selectedRating;
        targetTrip.ratingComment = comment;
        if (
          typeof targetTrip.driver === 'object' &&
          targetTrip.driver !== null &&
          typeof res?.ratingAverage === 'number'
        ) {
          targetTrip.driver.ratingAverage = res.ratingAverage;
          targetTrip.driver.ratingCount = res.ratingCount;
        }
        this.isSubmittingRating = false;
        this.ratingModalTrip = null;
        this.snackBar.open('Thank you for rating your trip!', 'Close', { duration: 3500 });
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
  }

  getReceiptDriverName(trip: Trip): string {
    return (trip.driver as any)?.name || 'Assigned Driver';
  }

  getReceiptDriverNif(trip: Trip): string {
    return (trip.driver as any)?.NIF || '';
  }

  getReceiptDriverPhoto(trip: Trip): string | null {
    return (trip.driver as any)?.profilePhoto || null;
  }

  openPhotoModal(): void {
    if (!this.clienteSelecionado) return;
    this.draftPhoto = this.clienteSelecionado.profilePhoto || null;
    this.photoError = '';
    this.showPhotoModal = true;
  }

  closePhotoModal(): void {
    if (!this.isUpdatingPhoto) {
      this.showPhotoModal = false;
      this.photoError = '';
    }
  }

  submitPhotoUpdate(): void {
    if (!this.clienteSelecionado?._id || this.isUpdatingPhoto) return;
    this.photoError = '';
    this.isUpdatingPhoto = true;

    this.clientService.updateClientPhoto(this.clienteSelecionado._id, this.draftPhoto).subscribe({
      next: (updated) => {
        this.isUpdatingPhoto = false;
        this.clienteSelecionado = {
          ...this.clienteSelecionado!,
          profilePhoto: updated?.profilePhoto || null
        };
        localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(this.clienteSelecionado));
        this.showPhotoModal = false;
        this.snackBar.open('Profile photo updated!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isUpdatingPhoto = false;
        this.photoError = err?.error?.error || 'Could not update profile photo.';
      }
    });
  }

  getTripDurationMin(trip: Trip): number {
    return Math.max(
      1,
      Math.floor((new Date(trip.exitTime).getTime() - new Date(trip.entryTime).getTime()) / 60000)
    );
  }

  getReceiptTaxiImage(): string {
    return this.receiptTaxi ? getTaxiCarImage(this.receiptTaxi.brand, this.receiptTaxi.model) : '';
  }

  private escapeHtml(val: unknown): string {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  printReceipt(): void {
    const trip = this.selectedReceiptTrip;
    if (!trip) return;

    const win = window.open('', '_blank', 'width=680,height=760');
    if (!win) return;

    const ref = this.escapeHtml((trip._id || '').slice(-8).toUpperCase() || 'RECEIPT');
    const pickup = this.escapeHtml(trip.entryAddressLabel || this.formatAddress(trip.entryAddress));
    const dropoff = this.escapeHtml(trip.exitAddressLabel || this.formatAddress(trip.exitAddress));
    const entryStr = this.escapeHtml(
      new Date(trip.entryTime).toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    );
    const exitStr = this.escapeHtml(
      new Date(trip.exitTime).toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    );
    const durationMin = this.getTripDurationMin(trip);
    const distance = trip.distanceKm.toFixed(2);
    const price = trip.price.toFixed(2);
    const clientName = this.escapeHtml(this.clienteSelecionado?.name || '');
    const clientNif = this.escapeHtml(this.clienteSelecionado?.NIF || '');
    const driverName = this.escapeHtml(this.getReceiptDriverName(trip));
    const driverNif = this.escapeHtml(this.getReceiptDriverNif(trip));
    const taxiLine = this.receiptTaxi
      ? `${this.escapeHtml(this.receiptTaxi.brand)} ${this.escapeHtml(this.receiptTaxi.model)} · ${this.escapeHtml(this.receiptTaxi.licensePlate)} (${this.escapeHtml(this.receiptTaxi.confort)})`
      : '';
    const ratingLine = trip.rating
      ? `<div class="section"><div class="label">Rating</div><div class="val">★ ${trip.rating}/5</div>${trip.ratingComment ? `<div style="font-size:13px;color:#4b5563;font-style:italic;">“${this.escapeHtml(trip.ratingComment)}”</div>` : ''}</div>`
      : '';

    win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>TaxiApp Receipt #${ref}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 32px; max-width: 600px; margin: 0 auto; }
    .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FFEB3B; padding-bottom: 14px; margin-bottom: 22px; }
    .brand { font-size: 20px; font-weight: 800; }
    .ref { font-size: 13px; font-weight: 700; color: #6b7280; }
    .section { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; font-weight: 700; margin-bottom: 3px; }
    .val { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .val:last-child { margin-bottom: 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
    .stat { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
    .total { display: flex; justify-content: space-between; align-items: center; background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 16px; font-size: 18px; font-weight: 800; }
    .total-price { color: #15803d; font-size: 22px; }
  </style>
</head>
<body>
  <div class="head">
    <div class="brand">TaxiApp · Trip Receipt</div>
    <div class="ref">#${ref}</div>
  </div>
  <div class="section">
    <div class="label">Pickup (${entryStr})</div>
    <div class="val">${pickup}</div>
    <div class="label">Drop-off (${exitStr})</div>
    <div class="val">${dropoff}</div>
  </div>
  <div class="grid">
    <div class="stat"><div class="label">Duration</div><div class="val">${durationMin} min</div></div>
    <div class="stat"><div class="label">Distance</div><div class="val">${distance} km</div></div>
    <div class="stat"><div class="label">Passengers</div><div class="val">${trip.numberOfPeople}</div></div>
  </div>
  <div class="section">
    <div class="label">Client</div>
    <div class="val">${clientName}${clientNif ? ` · NIF: ${clientNif}` : ''}</div>
    <div class="label">Driver</div>
    <div class="val">${driverName}${driverNif ? ` · NIF: ${driverNif}` : ''}</div>
    ${taxiLine ? `<div class="label">Taxi</div><div class="val">${taxiLine}</div>` : ''}
  </div>
  ${ratingLine}
  <div class="total">
    <span>Total Paid</span>
    <span class="total-price">€${price}</span>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 200);
  }
}
