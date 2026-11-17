import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoViagemService } from '../../appServices/ride-request.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { SocketService } from '../../appServices/socket.service';
import { PedidoViagem } from '../../client/ride-request.interface';
import { Motorista } from '../../drivers/driver.interface';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-aguardar-resposta',
  templateUrl: './waiting-response.component.html',
  styleUrls: ['./waiting-response.component.css']
})
export class AguardarRespostaComponent implements OnInit, OnDestroy {
  pedidoId: string = '';
  pedido: PedidoViagem | null = null;
  motorista: Motorista | null = null;
  loading: boolean = true;
  erro: string = '';
  pickupAddress: string = '';
  destinationAddress: string = '';
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
    private pedidoViagemService: PedidoViagemService,
    private geolocationService: GeolocationService,
    private socketService: SocketService,
    private router: Router
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
      this.socketService.onEvent<PedidoViagem>('pedido:driverAccepted').subscribe((pedidoAtualizado) => {
        if (pedidoAtualizado && pedidoAtualizado.driverId) {
          this.router.navigate(['/client/confirm-trip', this.pedidoId]);
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
    this.pedidoViagemService.getPedidoById(this.pedidoId).subscribe({
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

  async cancelarPedido() {
    const confirmacao = window.confirm('Are you sure you want to cancel the ride request?');
    if (!confirmacao) {
      return;
    }
    try {
      await firstValueFrom(this.pedidoViagemService.deletePedido(this.pedidoId));
      this.router.navigate(['/client']);
    } catch (error) {
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