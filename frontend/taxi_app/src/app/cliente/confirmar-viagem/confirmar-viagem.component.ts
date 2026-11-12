import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
import { PedidoViagem } from '../pedidoViagem_interface';
import { Motorista } from '../../motoristas/motorista_interface';
import { Taxi } from '../../taxis/taxi_interface';
import { TurnoService } from '../../appServices/turno.service';
import { TaxiService } from '../../appServices/taxi.service';
import { MotoristaService } from '../../appServices/motorista.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { Turno } from '../../turno/turno_interface';
import { PrecoService } from '../../appServices/preco.service';

@Component({
  selector: 'app-confirmar-viagem',
  templateUrl: './confirmar-viagem.component.html',
  styleUrls: ['./confirmar-viagem.component.css']
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
  ) { }

  ngOnInit() {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      this.erro = 'ID do pedido inválido';
      this.loading = false;
      return;
    }
    this.carregarDados(pedidoId);
  }

  async carregarDados(pedidoId: string) {
    try {
      // Carregar dados do pedido
      const pedidoResponse = await firstValueFrom(this.pedidoViagemService.getPedidoById(pedidoId));
      if (!pedidoResponse) {
        throw new Error('Pedido não encontrado');
      }
      this.pedido = pedidoResponse;
      
      if (!this.pedido.motoristaId) {
        throw new Error('Este pedido não tem um motorista associado');
      }
      
      if (!this.pedido.taxi) {
        throw new Error('Este pedido não tem um táxi associado');
      }
      
      // Carregar dados do motorista
      const motoristaResponse = await firstValueFrom(this.motoristaService.getMotoristaPorId(this.pedido.motoristaId));
      if (!motoristaResponse) {
        throw new Error('Motorista não encontrado');
      }
      this.motorista = motoristaResponse;

      // Carregar dados do táxi
      const taxiResponse = await firstValueFrom(this.taxiService.getTaxiById(this.pedido.taxi));
      if (!taxiResponse) {
        throw new Error('Táxi não encontrado');
      }
      this.taxi = taxiResponse;

      
      // Obter geolocalização do cliente em string
      const [lat, lng] = this.pedido.entryAddress.split(',').map(Number);
      this.entryCidadeRua = await this.geolocationService.getAddressFromCoordinates(lat.toString(), lng.toString());
      
      const [lat2, lng2] = this.pedido.exitAddress.split(',').map(Number);
      this.exitCidadeRua = await this.geolocationService.getAddressFromCoordinates(lat2.toString(), lng2.toString());

      const preco = await firstValueFrom(this.precoService.getPreco());
      if (!preco) {
        throw new Error('Preço não encontrado');
      }
      this.nightSurcharge = preco.nightTimeSurcharge;
      const distancia = this.pedidoViagemService.calcularDistancia(
        Number(this.pedido.entryAddress.split(',')[0]),
        Number(this.pedido.entryAddress.split(',')[1]),
        Number(this.pedido.exitAddress.split(',')[0]),
        Number(this.pedido.exitAddress.split(',')[1])
      );
      this.tempoEstimadoMin = Math.ceil(distancia * 4); // Aproximado 4 minutos por km
      if (taxiResponse.confort === 'Basico') {
        this.custoEstimado = Math.round(preco.pricePerMinuteConfort * this.tempoEstimadoMin * 100) / 100;
      } else {
        this.custoEstimado = Math.round(preco.pricePerMinuteLuxury * this.tempoEstimadoMin * 100) / 100;
      }

      this.loading = false;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      this.erro = error instanceof Error ? error.message : 'Erro ao carregar dados da viagem';
      this.loading = false;
    }
  }  

  async aceitarMotorista() {
    if (!this.pedido){
      console.error('Pedido não encontrado');
      return;
    }
    try {
      this.pedidoViagemService.acceptClient(this.pedido._id!).subscribe({
        next: (res) => {
          alert('Pedido confirmado com sucesso!');
          console.log("response:", res);
          localStorage.setItem('pedidoId', this.pedido!._id!);
          this.router.navigate(['cliente/acompanhar-viagem', this.pedido!._id!]);
        },
        error: (err) => {
          console.error('Erro ao aceitar motorista:', err);
          this.erro = 'Erro ao aceitar motorista';
        }
      });
    } catch (error) {
      console.error('Erro ao aceitar motorista:', error);
      this.erro = 'Erro ao aceitar motorista';
      }
  }

  async recusarMotorista() {
    const pedidoId = this.pedido?._id ?? this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      this.erro = 'Não foi possível identificar o pedido.';
      return;
    }

    try {
      await firstValueFrom(this.pedidoViagemService.rejectMotorista(pedidoId, this.pedido?.motoristaId));
      this.router.navigate(['/cliente/aguardar-resposta', pedidoId]);
    } catch (error) {
      console.error('Erro ao cancelar viagem:', error);
      this.erro = 'Erro ao cancelar viagem. Tente novamente.';
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