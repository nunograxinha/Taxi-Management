import { sequence } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from '../../appServices/cliente.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { MotoristaService } from '../../appServices/motorista.service';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
import { PrecoService } from '../../appServices/preco.service';
import { TaxiService } from '../../appServices/taxi.service';
import { TurnoService } from '../../appServices/turno.service';
import { ViagemService } from '../../appServices/viagem.service';
import { PedidoViagem } from '../../cliente/pedidoViagem_interface';
import { Preco } from '../../gerir-precos/preco_interface';
import { Turno } from '../../turno/turno_interface';
import { Viagem } from '../../viagem/viagem_interface';

@Component({
  selector: 'app-pedido-aceito',
  templateUrl: './pedido-aceito.component.html',
  styleUrls: ['./pedido-aceito.component.css']
})
export class PedidoAceitoComponent implements OnInit {
  pedido: PedidoViagem  | null = null;
  pedidoId: string = '';
  startTimeLocal: string | null = null;
  endTimeLocal: string | null = null;
  precoFinal: number | null = null;
  preco: Preco | null = null;
  bloquearBotoes: boolean = false;
  duracaoViagem: number | null = null;
  nomeCliente: string ='';
  startLocal: string = '';
  endLocal: string = '';
  numPessoas: number = 1;
  numPessoasConfirmado: boolean = false;

  constructor(
    private pedidoViagemService: PedidoViagemService,
    private route: ActivatedRoute,
    private precoService: PrecoService,
    private taxiService: TaxiService,
    private viagemService: ViagemService,
    private turnoService: TurnoService,
    private motoristaService: MotoristaService,
    private router: Router,
    private geolocationService: GeolocationService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      console.error('Pedido ID não fornecido');
      return;
    }
    this.pedidoId = pedidoId;
    this.pedidoViagemService.getPedidoById(pedidoId).subscribe({
      next: (pedido) => { 
        this.pedido = pedido; 
        if (typeof pedido.cliente === 'object' && pedido.cliente !== null) {
              this.nomeCliente = (pedido.cliente as any).name || '';
            } else {
              this.nomeCliente = '';
            }
        },
      error: (error) => { console.error('Erro ao buscar o pedido:', error); }
    });
    this.precoService.getPreco().subscribe({
      next: (preco) => { this.preco = preco; },
      error: (error) => { console.error('Erro ao buscar o preço:', error); }
    });
  }

  comecarViagem(): void {
  if (!this.pedidoId || this.bloquearBotoes) {
    console.error('Pedido ID não está definido (ou já iniciado e terminado).');
    return;
  }
  this.geolocationService.getCurrentPosition().subscribe({
    next: async (pos) => {
      const entryAddress = `${pos.latitude},${pos.longitude}`;
      const startTime = new Date();
      this.pedidoViagemService.updatePedido(this.pedidoId, { startTime, entryAddress }).subscribe({
        next: async () => {
          this.startTimeLocal = startTime.toISOString();
          if (this.pedido) {
            this.pedido.startTime = startTime;
            this.pedido.entryAddress = entryAddress;
          }
          // Obter endereço legível
          try {
            this.startLocal = await this.geolocationService.getAddressFromCoordinates(pos.latitude, pos.longitude);
          } catch {
            this.startLocal = 'endereço não encontrado';
          }
        },
        error: (error) => console.error('Erro ao iniciar a viagem:', error)
      });
    },
    error: (error) => console.error('Erro ao obter localização inicial:', error)
  });
}

  terminarViagem(): void {
    if (!this.pedidoId || this.bloquearBotoes) {
      console.error('Pedido ID não está definido (ou já iniciado e terminado).');
      return;
    }
    this.geolocationService.getCurrentPosition().subscribe({
    next: async (pos) => {
      const exitAddress = `${pos.latitude},${pos.longitude}`;
      const endTime = new Date();
      this.pedidoViagemService.updatePedido(this.pedidoId, { endTime, exitAddress }).subscribe({
        next: async () => {
          this.endTimeLocal = endTime.toISOString();
          if (this.pedido) {
            this.pedido.endTime = endTime;
            this.pedido.exitAddress = exitAddress;
          }
          try {
            this.endLocal = await this.geolocationService.getAddressFromCoordinates(pos.latitude, pos.longitude);
          } catch {
            this.endLocal = 'endereço não encontrado';
          }
          this.pedidoViagemService.updatePedido(this.pedidoId, { endTime }).subscribe({
            next: () => {
              console.log('Viagem terminada.')
              this.endTimeLocal = endTime.toISOString();
              if (this.pedido) {
                this.pedido.endTime = endTime;
              } else {
                console.error('Pedido não está definido.');
                return;
              }
              setTimeout(() => {
                this.bloquearBotoes = true;
              }, 1000);

              const start = new Date(this.pedido!.startTime!);
              const end = endTime;
              const totalMinutos = Math.floor((end.getTime() - start.getTime()) / 60000);
              const minutosNoite = this.calcularTempoNoite(start, end);

              this.taxiService.getTaxiById(this.pedido!.taxi!).toPromise().then(taxi => {
              const confort = taxi?.confort;
              let precoMinuto = 0;
              if (confort === 'Basico') {
                precoMinuto = this.preco!.pricePerMinuteConfort;
              } else if (confort === 'Luxuoso') {
                precoMinuto = this.preco!.pricePerMinuteLuxury;
              }
              this.duracaoViagem = totalMinutos;
              const minutosDia = totalMinutos - minutosNoite;
              const precoDia = precoMinuto * minutosDia;
              const precoNoite = minutosNoite * (precoMinuto * (1 + (this.preco!.nightTimeSurcharge / 100)));
              this.precoFinal = Math.round((precoDia + precoNoite) *100) / 100;

              this.pedidoViagemService.updatePedido(this.pedidoId, { price: this.precoFinal }).subscribe({
              next: () => {
                console.log('Preço do pedido atualizado:', this.precoFinal);},
              error: (error) => {
                console.error('Erro ao atualizar o preço do pedido:', error);
              }
            });
          });
        },
        error: (error) => console.error('Erro ao terminar a viagem:', error)
      });
        },
        error: (error) => console.error('Erro ao terminar a viagem:', error)
      });
    },
      error: (error) => console.error('Erro ao terminar a viagem:', error)
    });
  }

  formatarHoraMinuto(dateString: string | null): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  private calcularTempoNoite(start: Date, end : Date) {
    let minutosNoite = 0;
    let current = new Date(start);
    while (current < end) {
      const hora = current.getHours();
      if (hora >= 21 || hora < 6) {
        minutosNoite++;
      }
      current.setMinutes(current.getMinutes() + 1);
    }
    return minutosNoite;
  }


  confirmarFimViagem(): void {
    if (!this.pedido || !this.pedido.endTime || !this.pedido.startTime || this.precoFinal === null) {
      alert('Dados da viagem incompletos.');
      return;
    } else {

    // Obter o motorista pelo ID para ter o NIF
    this.motoristaService.getMotoristaPorId(this.pedido.motoristaId!).subscribe({
      next: (motorista) => {
        if (!motorista || !motorista.NIF) {
          alert('Não foi possível encontrar o NIF do motorista.');
          return;
        }
        const startTimeISO = this.pedido!.startTime!.toISOString();

        const entryCoords = this.pedido!.entryAddress!.split(',').map(Number);
        const exitCoords = this.pedido!.exitAddress!.split(',').map(Number);
        const distanceKm = haversineDistance(
          entryCoords[0], entryCoords[1],
          exitCoords[0], exitCoords[1]
        );

        this.turnoService.getTurnosInTimeFrame(
          motorista.NIF,
          startTimeISO,
          startTimeISO
        ).subscribe({
          next: (turnos) => {
            const turno = turnos[0];
            const novaViagem = {
              turno: turno?._id,
              numberOfPeople: this.pedido!.numberOfPeople,
              distanceKm: distanceKm,
              entryTime: this.pedido!.startTime,
              exitTime: this.pedido!.endTime,
              entryAddress: this.pedido!.entryAddress,
              exitAddress: this.pedido!.exitAddress,
              motorista: this.pedido!.motoristaId,
              cliente: this.pedido!.cliente,
              preco: this.precoFinal
            };
            console.log('Dados enviados para criarViagem:', novaViagem);
            this.viagemService.criarViagem(novaViagem).subscribe({
              next: () => {
                this.pedidoViagemService.deletePedido(this.pedidoId).subscribe({
                  next: () => {
                    alert('Viagem finalizada com sucesso!');
                    this.router.navigate(['/motorista', motorista.NIF]);
                  },
                  error: (error) => {
                    console.error('Erro ao excluir o pedido:', error);
                    alert('Erro ao excluir o pedido.');
                  }
                });
              },
              error: (error) => {
                console.error('Erro ao criar viagem:', error);
                alert('Erro ao criar viagem.');
              }
            });
          },
          error: (error) => {
            console.error('Erro ao buscar turno:', error);
            alert('Erro ao buscar turno.');
          }
        });
      },
      error: (error) => {
        console.error('Erro ao obter o motorista:', error);
        alert('Erro ao obter o motorista.');
      }
    });
  }
  }


  confirmarNumeroPessoas(): void {
    if (!this.pedidoId) return;
    this.pedidoViagemService.updatePedido(this.pedidoId, { numberOfPeople: this.numPessoas }).subscribe({
      next: () => {
        this.numPessoasConfirmado = true;
        if (this.pedido) this.pedido.numberOfPeople = this.numPessoas;
      },
      error: (error) => {
        console.error('Erro ao confirmar número de pessoas:', error);
      }
    });
  }

  editarNumeroPessoas(): void {
    this.numPessoasConfirmado = false;
  }


}

// Função utilitária fora da classe
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const toRad = (deg: number) => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



