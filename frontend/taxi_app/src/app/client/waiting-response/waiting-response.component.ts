import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RideRequestService } from '../../appServices/ride-request.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { SocketService } from '../../appServices/socket.service';
import { RideRequest } from '../../client/ride-request.interface';
import { Driver } from '../../drivers/driver.interface';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-aguardar-resposta',
  templateUrl: './waiting-response.component.html',
  styleUrls: ['./waiting-response.component.css']
})
export class WaitingResponseComponent implements OnInit, OnDestroy {
  pedidoId: string = '';
  pedido: RideRequest | null = null;
  motorista: Driver | null = null;
  loading: boolean = true;
  erro: string = '';
  pickupAddress: string = '';
  destinationAddress: string = '';
  showCancelModal: boolean = false;
  isCancelling: boolean = false;
  private subscriptions = new Subscription();
  private fallbackPollTimer: any = null;
  private readonly onVisibilityOrOnline = () => {
    if (!document.hidden && this.pedidoId) {
      this.socketService.joinPedido(this.pedidoId);
      this.carregarPedido();
    }
  };

  constructor(
    private route: ActivatedRoute,
    private pedidoViagemService: RideRequestService,
    private geolocationService: GeolocationService,
    private socketService: SocketService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('pedidoId');
    if (!paramId) {
      this.erro = 'Invalid ride request ID.';
      this.loading = false;
      return;
    }
    this.pedidoId = paramId;
    this.socketService.joinPedido(this.pedidoId);
    this.carregarPedido();

    // Real-time WebSocket listener for driver acceptance
    this.subscriptions.add(
      this.socketService.onEvent<RideRequest>('pedido:driverAccepted').subscribe((pedidoAtualizado) => {
        if (pedidoAtualizado && pedidoAtualizado.driverId) {
          this.router.navigate(['/client/confirm-trip', this.pedidoId]);
        }
      })
    );

    this.subscriptions.add(
      this.socketService.onEvent<{ id: string; reason?: string }>('pedido:deleted').subscribe((ev) => {
        if (ev && String(ev.id) === String(this.pedidoId)) {
          localStorage.removeItem('pedidoId');
          const msg = ev.reason === 'expired'
            ? 'Your ride request expired after 5 minutes without a driver.'
            : 'Your ride request was cancelled.';
          this.snackBar.open(msg, 'Close', { duration: 4500 });
          this.router.navigate(['/client']);
        }
      })
    );

    // Re-sync when socket reconnects or mobile browser wakes from background
    this.subscriptions.add(
      this.socketService.onEvent<void>('connect').subscribe(() => {
        this.socketService.joinPedido(this.pedidoId);
        this.carregarPedido();
      })
    );
    document.addEventListener('visibilitychange', this.onVisibilityOrOnline);
    window.addEventListener('online', this.onVisibilityOrOnline);

    // Safety fallback poll every 5s in case mobile OS throttled WebSocket
    this.fallbackPollTimer = setInterval(() => {
      if (!document.hidden && this.pedidoId) {
        this.carregarPedido();
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityOrOnline);
    window.removeEventListener('online', this.onVisibilityOrOnline);
    if (this.fallbackPollTimer) {
      clearInterval(this.fallbackPollTimer);
    }
    if (this.pedidoId) {
      this.socketService.leavePedido(this.pedidoId);
    }
    this.subscriptions.unsubscribe();
  }

  carregarPedido(): void {
    this.pedidoViagemService.getRideRequestById(this.pedidoId).subscribe({
      next: async (pedido) => {
        this.pedido = pedido ? pedido : null;
        this.loading = false;
        if (pedido && pedido.driverId) {
          this.router.navigate(['/client/confirm-trip', this.pedidoId]);
          return;
        }
        if (pedido) {
          const [pickup, dest] = await Promise.all([
            this.resolveAddress(pedido.entryAddress),
            this.resolveAddress(pedido.exitAddress)
          ]);
          this.pickupAddress = pickup;
          this.destinationAddress = dest;
        }
      },
      error: (err) => {
        console.error('Error loading ride request:', err);
        this.erro = 'Error loading ride request.';
        this.loading = false;
      }
    });
  }

  abrirModalCancelar(): void {
    this.showCancelModal = true;
  }

  fecharModalCancelar(): void {
    if (!this.isCancelling) {
      this.showCancelModal = false;
    }
  }

  async cancelarPedido() {
    if (this.isCancelling) return;
    this.isCancelling = true;
    try {
      await firstValueFrom(this.pedidoViagemService.deleteRideRequest(this.pedidoId));
      this.showCancelModal = false;
      this.router.navigate(['/client']);
    } catch (error) {
      this.isCancelling = false;
      this.showCancelModal = false;
      console.error('Error cancelling ride request:', error);
      this.erro = 'Error cancelling ride request.';
    }
  }

  private async resolveAddress(coords?: string): Promise<string> {
    if (!coords) return 'Address not available';
    const parts = coords.split(',').map(part => part.trim());
    if (parts.length !== 2 || parts.some(part => !part || isNaN(Number(part)))) {
      return coords;
    }
    try {
      return await this.geolocationService.getAddressFromCoordinates(parts[0], parts[1]);
    } catch {
      return `${Number(parts[0]).toFixed(4)}, ${Number(parts[1]).toFixed(4)}`;
    }
  }

}