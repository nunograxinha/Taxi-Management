import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
      console.error('Request ID not provided');
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
      error: (error) => { console.error('Error fetching ride request:', error); }
    });
    this.precoService.getPreco().subscribe({
      next: (preco) => { this.preco = preco; },
      error: (error) => { console.error('Error fetching price:', error); }
    });
  }

  comecarViagem(): void {
  if (!this.pedidoId || this.bloquearBotoes) {
    console.error('Request ID is not defined (or already started and finished).');
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
          // Get readable address
          try {
            this.startLocal = await this.geolocationService.getAddressFromCoordinates(pos.latitude, pos.longitude);
          } catch {
            this.startLocal = 'address not found';
          }
        },
        error: (error) => console.error('Error starting trip:', error)
      });
    },
    error: (error) => console.error('Error getting initial location:', error)
  });
}

  terminarViagem(): void {
    if (!this.pedidoId || !this.pedido || this.bloquearBotoes) {
      console.error('Request ID is not defined (or already started and finished).');
      return;
    }
    this.geolocationService.getCurrentPosition().subscribe({
      next: async (pos) => {
        const exitAddress = `${pos.latitude},${pos.longitude}`;
        const endTime = new Date();

        try {
          this.endLocal = await this.geolocationService.getAddressFromCoordinates(pos.latitude, pos.longitude);
        } catch {
          this.endLocal = 'address not found';
        }

        const start = new Date(this.pedido!.startTime!);
        const totalMinutos = Math.floor((endTime.getTime() - start.getTime()) / 60000);
        const minutosNoite = this.calcularTempoNoite(start, endTime);

        const taxi = await firstValueFrom(this.taxiService.getTaxiById(this.pedido!.taxi!));
        const confort = taxi?.confort || this.pedido!.confort;
        let precoMinuto = 0;
        if (confort === 'Basic') {
          precoMinuto = this.preco!.pricePerMinuteConfort;
        } else if (confort === 'Luxury') {
          precoMinuto = this.preco!.pricePerMinuteLuxury;
        }

        this.duracaoViagem = totalMinutos;
        const minutosDia = totalMinutos - minutosNoite;
        const precoDia = precoMinuto * minutosDia;
        const precoNoite = minutosNoite * (precoMinuto * (1 + (this.preco!.nightTimeSurcharge / 100)));
        this.precoFinal = Math.round((precoDia + precoNoite) * 100) / 100;

        this.pedidoViagemService.updatePedido(this.pedidoId, {
          endTime,
          exitAddress,
          price: this.precoFinal
        }).subscribe({
          next: () => {
            console.log('Trip finished and price updated:', this.precoFinal);
            this.endTimeLocal = endTime.toISOString();
            if (this.pedido) {
              this.pedido.endTime = endTime;
              this.pedido.exitAddress = exitAddress;
              this.pedido.price = this.precoFinal!;
            }
            setTimeout(() => {
              this.bloquearBotoes = true;
            }, 1000);
          },
          error: (error) => console.error('Error finishing trip:', error)
        });
      },
      error: (error) => console.error('Error getting final location:', error)
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
      alert('Incomplete trip data.');
      return;
    } else {

    // Get driver by ID to obtain NIF
    this.motoristaService.getMotoristaPorId(this.pedido.motoristaId!).subscribe({
      next: (motorista) => {
        if (!motorista || !motorista.NIF) {
          alert('Could not find driver NIF.');
          return;
        }
        const startTimeISO = new Date(this.pedido!.startTime!).toISOString();

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
            console.log('Data sent to criarViagem:', novaViagem);
            this.viagemService.criarViagem(novaViagem).subscribe({
              next: () => {
                this.pedidoViagemService.deletePedido(this.pedidoId).subscribe({
                  next: () => {
                    alert('Trip finished successfully!');
                    this.router.navigate(['/motorista', motorista.NIF]);
                  },
                  error: (error) => {
                    console.error('Error deleting ride request:', error);
                    alert('Error deleting ride request.');
                  }
                });
              },
              error: (error) => {
                console.error('Error creating trip:', error);
                alert('Error creating trip.');
              }
            });
          },
          error: (error) => {
            console.error('Error fetching shift:', error);
            alert('Error fetching shift.');
          }
        });
      },
      error: (error) => {
        console.error('Error fetching driver:', error);
        alert('Error fetching driver.');
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
        console.error('Error confirming number of passengers:', error);
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



