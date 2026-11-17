import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { PedidoViagemService } from '../../appServices/ride-request.service';
import { PedidoViagem } from '../ride-request.interface';
import { Motorista } from '../../drivers/driver.interface';
import { Taxi } from '../../taxis/taxi.interface';
import { TurnoService } from '../../appServices/shift.service';
import { TaxiService } from '../../appServices/taxi.service';
import { MotoristaService } from '../../appServices/driver.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { Turno } from '../../shifts/shift.interface';
import { PrecoService } from '../../appServices/price.service';

@Component({
  selector: 'app-confirmar-viagem',
  templateUrl: './confirm-trip.component.html',
  styleUrls: ['./confirm-trip.component.css']
})
export class ConfirmarViagemComponent implements OnInit {
  pedido: PedidoViagem | null = null;
  motorista: Motorista | null = null;
  taxi: Taxi | null = null;
  loading = true;
  erro = '';
  entryCidadeRua = '';
  exitCidadeRua = '';
  tempoEstimadoMin = 0;
  nightSurcharge = 0;
  custoEstimado = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoViagemService: PedidoViagemService,
    private taxiService: TaxiService,
    private motoristaService: MotoristaService,
    private geolocationService: GeolocationService,
    private precoService: PrecoService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      this.erro = 'Invalid ride request ID';
      this.loading = false;
      return;
    }
    this.carregarDados(pedidoId);
  }

  async carregarDados(pedidoId: string) {
    try {
      // Load ride request data
      const pedidoResponse = await firstValueFrom(this.pedidoViagemService.getPedidoById(pedidoId));
      if (!pedidoResponse) {
        throw new Error('Ride request not found');
      }
      this.pedido = pedidoResponse;
      
      if (!this.pedido.driverId) {
        throw new Error('This ride request does not have an assigned driver');
      }
      
      if (!this.pedido.taxi) {
        throw new Error('This ride request does not have an assigned taxi');
      }
      
      // Load driver data
      const motoristaResponse = await firstValueFrom(this.motoristaService.getMotoristaPorId(this.pedido.driverId));
      if (!motoristaResponse) {
        throw new Error('Driver not found');
      }
      this.motorista = motoristaResponse;

      // Load taxi data
      const taxiResponse = await firstValueFrom(this.taxiService.getTaxiById(this.pedido.taxi));
      if (!taxiResponse) {
        throw new Error('Taxi not found');
      }
      this.taxi = taxiResponse;

      
      // Get client geolocation in string
      const [lat, lng] = this.pedido.entryAddress.split(',').map(Number);
      this.entryCidadeRua = await this.geolocationService.getAddressFromCoordinates(lat.toString(), lng.toString());
      
      const [lat2, lng2] = this.pedido.exitAddress.split(',').map(Number);
      this.exitCidadeRua = await this.geolocationService.getAddressFromCoordinates(lat2.toString(), lng2.toString());

      const preco = await firstValueFrom(this.precoService.getPreco());
      if (!preco) {
        throw new Error('Price not found');
      }
      this.nightSurcharge = preco.nightTimeSurcharge;
      const distancia = this.pedidoViagemService.calcularDistancia(
        Number(this.pedido.entryAddress.split(',')[0]),
        Number(this.pedido.entryAddress.split(',')[1]),
        Number(this.pedido.exitAddress.split(',')[0]),
        Number(this.pedido.exitAddress.split(',')[1])
      );
      this.tempoEstimadoMin = Math.ceil(distancia * 4); // Approx 4 minutes per km
      if (taxiResponse.confort === 'Basic') {
        this.custoEstimado = Math.round(preco.pricePerMinuteConfort * this.tempoEstimadoMin * 100) / 100;
      } else {
        this.custoEstimado = Math.round(preco.pricePerMinuteLuxury * this.tempoEstimadoMin * 100) / 100;
      }

      this.loading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.erro = error instanceof Error ? error.message : 'Error loading trip data';
      this.loading = false;
    }
  }  

  async aceitarMotorista() {
    if (!this.pedido){
      console.error('Ride request not found');
      return;
    }
    try {
      this.pedidoViagemService.acceptClient(this.pedido._id!).subscribe({
        next: (res) => {
          this.snackBar.open('Ride request confirmed successfully!', 'Close', { duration: 3500 });
          console.log("response:", res);
          localStorage.setItem('pedidoId', this.pedido!._id!);
          this.router.navigate(['/client/track-trip', this.pedido!._id!]);
        },
        error: (err) => {
          console.error('Error accepting driver:', err);
          this.erro = 'Error accepting driver';
        }
      });
    } catch (error) {
      console.error('Error accepting driver:', error);
      this.erro = 'Error accepting driver';
      }
  }

  async recusarMotorista() {
    const pedidoId = this.pedido?._id ?? this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      this.erro = 'Could not identify the ride request.';
      return;
    }

    try {
      await firstValueFrom(this.pedidoViagemService.rejectMotorista(pedidoId, this.pedido?.driverId));
      this.router.navigate(['/client/waiting-response', pedidoId]);
    } catch (error) {
      console.error('Error rejecting driver:', error);
      this.erro = 'Error rejecting driver. Please try again.';
    }
  }

  get showNightWarning(): boolean {
    const agora = new Date();
    const horaAtual = agora.getHours();
    const horaFimEstimada = (horaAtual + Math.ceil(this.tempoEstimadoMin / 60)) % 24;
    return this.nightSurcharge > 0 && (
      (horaAtual >= 21 || horaAtual < 6) ||
      (horaFimEstimada >= 21 || horaFimEstimada < 6)
    );
  }

}