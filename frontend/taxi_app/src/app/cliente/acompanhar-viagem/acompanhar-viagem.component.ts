import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
import { SocketService } from '../../appServices/socket.service';
import { PedidoViagem } from '../pedidoViagem_interface';
import { ActivatedRoute } from '@angular/router';
import { GeolocationService } from '../../appServices/geolocation.service';
import { MotoristaService } from '../../appServices/motorista.service';
import { TaxiService } from '../../appServices/taxi.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acompanhar-viagem',
  templateUrl: './acompanhar-viagem.component.html',
  styleUrls: ['./acompanhar-viagem.component.css']
})
export class AcompanharViagemComponent implements OnInit, OnDestroy {
  status: 'aguardando' | 'emCurso' | 'finalizada' = 'aguardando';
  pedido: PedidoViagem | null = null;
  pedidoId: string = '';
  preco: number = 0;
  partidaNome: string = '';
  destinoNome: string = '';
  motoristaNome: string = '';
  taxiMatricula: string = '';
  taxiMarca: string = '';
  taxiModelo: string = '';
  tempoMotorista: number = 0;
  horaPartida: Date = new Date();
  horaChegada: Date = new Date();
  private ultimoEntryAddress: string = '';
  private ultimoExitAddress: string = '';
  private subscriptions = new Subscription();


  constructor(
    private pedidoViagemService: PedidoViagemService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private geolocationService: GeolocationService,
    private motoristaService: MotoristaService,
    private taxiService: TaxiService,
    private router: Router,
  ){}

  ngOnInit() {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      console.error('Ride request ID not provided');
      return;
    }
    this.pedidoId = pedidoId;
    this.socketService.joinPedido(pedidoId);

    this.pedidoViagemService.getPedidoById(pedidoId).subscribe(res => {
      if (res) {
        this.processarEstadoPedido(res);
      }
    });

    this.subscriptions.add(
      this.socketService.onEvent<PedidoViagem>('pedido:updated').subscribe((pedidoAtualizado) => {
        if (pedidoAtualizado) {
          this.processarEstadoPedido(pedidoAtualizado);
        }
      })
    );
  }

  private processarEstadoPedido(res: PedidoViagem) {
    this.pedido = res;

    if (res.driverId && !this.motoristaNome) {
      this.motoristaService.getMotoristaPorId(res.driverId).subscribe(motorista => {
        this.motoristaNome = motorista.name;
      });
    }
    if (res.taxi && !this.taxiMatricula) {
      this.taxiService.getTaxiById(res.taxi).subscribe(taxi => {
        this.taxiMatricula = taxi.licensePlate;
        this.taxiMarca = taxi.brand;
        this.taxiModelo = taxi.model;
      });
    }
    if (res.distanceKmToDriver) {
      this.tempoMotorista = res.distanceKmToDriver;
    }
    this.atualizarNomesLocalidades(res);
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
    }
  }

  ngOnDestroy() {
    if (this.pedidoId) {
      this.socketService.leavePedido(this.pedidoId);
    }
    this.subscriptions.unsubscribe();
  }

  async atualizarNomesLocalidades(pedido: PedidoViagem) {
    if (pedido.entryAddress && pedido.entryAddress !== this.ultimoEntryAddress) {
      this.ultimoEntryAddress = pedido.entryAddress;
      const [lat, lon] = pedido.entryAddress.split(',');
      this.partidaNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
    }
    if (pedido.exitAddress && pedido.exitAddress !== this.ultimoExitAddress) {
      this.ultimoExitAddress = pedido.exitAddress;
      const [lat, lon] = pedido.exitAddress.split(',');
      this.destinoNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
    }
  }

  cancelarViagem() {
    if (!this.pedidoId) return;
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    this.pedidoViagemService.deletePedido(this.pedidoId).subscribe({
      next: () => {
        localStorage.removeItem('pedidoId');
        this.router.navigate(['/cliente']);
      },
      error: (err) => {
        console.error('Error cancelling ride:', err);
      }
    });
  }

  getDuracaoViagemMinutos(): number | null {
    if (!this.pedido?.startTime || !this.pedido?.endTime) return null;
    const inicio = new Date(this.pedido.startTime).getTime();
    const fim = new Date(this.pedido.endTime).getTime();
    return Math.floor((fim - inicio) / 60000); // minutes
  }

  voltarClientePage() {
    this.router.navigate(['/cliente']);
  }

}
