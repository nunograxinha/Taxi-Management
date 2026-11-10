import { Component, OnDestroy, OnInit } from '@angular/core';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
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
  polling: any;
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


  constructor(
    private pedidoViagemService: PedidoViagemService,
    private route: ActivatedRoute,
    private geolocationService: GeolocationService,
    private motoristaService: MotoristaService,
    private taxiService: TaxiService,
    private router: Router,
  ){}

  ngOnInit() {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      console.error('Pedido ID não fornecido');
      return;
    }

    this.polling = setInterval(() => {
      this.pedidoViagemService.getPedidoById(pedidoId).subscribe(res => {
        this.pedido = res;

        if (res.motoristaId) {
          this.motoristaService.getMotoristaPorId(res.motoristaId).subscribe(motorista => {
            this.motoristaNome = motorista.name;
          });
        }
        if (res.taxi) {
          this.taxiService.getTaxiById(res.taxi).subscribe(taxi => {
            this.taxiMatricula = taxi.licensePlate;
            this.taxiMarca = taxi.brand;
            this.taxiModelo = taxi.model;
          });
        }
        if (res.distanceKmToMotorista) {
          this.tempoMotorista = res.distanceKmToMotorista;
        }
        this.atualizarNomesLocalidades(res);
        if(!res.startTime) {
          this.status = 'aguardando';
        } else if(res.startTime && !res.endTime) {
          this.status = 'emCurso';
          this.horaPartida = res.startTime;
        } else if (res.endTime) {
          this.status = 'finalizada';
          this.horaChegada = res.endTime;
          if (res.price) {
            this.preco = res.price;
          } 
        }
      });
    }, 3000);
  }

  ngOnDestroy() {
    if (this.polling) {
    clearInterval(this.polling);
    }
  }

  async atualizarNomesLocalidades(pedido: PedidoViagem) {
    if (pedido.entryAddress) {
      const [lat, lon] = pedido.entryAddress.split(',');
      this.partidaNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
    }
    if (pedido.exitAddress) {
      const [lat, lon] = pedido.exitAddress.split(',');
      this.destinoNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
    }
  }


  getDuracaoViagemMinutos(): number | null {
    if (!this.pedido?.startTime || !this.pedido?.endTime) return null;
    const inicio = new Date(this.pedido.startTime).getTime();
    const fim = new Date(this.pedido.endTime).getTime();
    return Math.floor((fim - inicio) / 60000); // minutos
  }

  voltarClientePage() {
    this.router.navigate(['/cliente']);
  }

}
