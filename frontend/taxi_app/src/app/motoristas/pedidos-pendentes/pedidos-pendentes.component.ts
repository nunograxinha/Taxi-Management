import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { MotoristaService } from '../../appServices/motorista.service';
import { TaxiService } from '../../appServices/taxi.service';
import { PrecoService } from '../../appServices/preco.service';
import { PedidoViagem } from '../../cliente/pedidoViagem_interface';
import { Motorista } from '../motorista_interface';
import { Taxi } from '../../taxis/taxi_interface';
import { Preco } from '../../gerir-precos/preco_interface';
import { TurnoService } from '../../appServices/turno.service';
import { Turno } from '../../turno/turno_interface';

@Component({
  selector: 'app-pedidos-pendentes',
  templateUrl: './pedidos-pendentes.component.html',
  styleUrls: ['./pedidos-pendentes.component.css']
})
export class PedidosPendentesComponent implements OnInit {
  motoristaNIF: string = '';
  motorista: any;
  taxi: any;
  pedidosPendentes: PedidoViagem[] = [];
  loading = true;
  erro = '';
  currentPosition: { latitude: number, longitude: number } = { latitude: 38.756734, longitude: -9.155412 }; // Default to FCUL
  precos: Preco | null = null;
  turnoAtual: Turno | null = null;
  clienteEnderecos: Map<string, string> = new Map();
  destinoEnderecos: Map<string, string> = new Map();
  distanciasCliente: Map<string, number> = new Map();
  temposChegada: Map<string, number> = new Map();
  distanciasViagem: Map<string, number> = new Map();
  temposViagem: Map<string, number> = new Map();
  temposTotais: Map<string, number> = new Map();


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoViagemService: PedidoViagemService,
    private motoristaService: MotoristaService,
    private taxiService: TaxiService,
    private geolocationService: GeolocationService,
    private precoService: PrecoService,
    private turnoService: TurnoService
  ) { }

  ngOnInit() {
    const url = this.router.url; // Obtém a URL completa
    const match = url.match(/\/motorista\/(\d+)\//); // Expressão regular para capturar o NIF entre "/motorista/" e "/"

    if (match && match[1]) {
      this.motoristaNIF = match[1];
      this.carregarDados();
    } else {
      console.error('Driver NIF not found in URL.');
      this.erro = 'Error loading driver data. NIF not found.';
      this.loading = false;
    }
  }
  
  async carregarDados() {
    try {
      
      this.geolocationService.getCurrentPosition().subscribe({
        next: (position) => {
          this.currentPosition = {
            latitude: parseFloat(position.latitude),
            longitude: parseFloat(position.longitude)
          };
        },
        error: (err) => {
          console.error('Error getting current position:', err);
          // Use default position (FCUL)
          console.log('Using default position (FCUL)');
        }
      });

      this.motoristaService.obterMotorista(this.motoristaNIF).subscribe({
        next: (motorista) => {
          console.log("motorista res:", motorista)
          this.motorista = motorista;
          this.carregarTurnoAtual();
        },
        error: (err) => {
          console.error('Error getting taxi id:', err);
        }
      })
      
      // Load pricing data
      this.precos = await firstValueFrom(this.precoService.getPreco()) || null;
      
    } catch (error) {
      console.error('Error in carregarDados:', error);
      this.erro = 'Error loading required data';
      this.loading = false;
    }
  }

  async carregarTurnoAtual() {
    try {
      
      const agora = new Date();
      const turnos = await firstValueFrom(this.turnoService.getTurnos()) || [];
      console.log("turnos:", turnos)
      console.log("agora:", agora)

      this.turnoAtual = turnos.find(turno => {
        const inicio = new Date(turno.start);
        const fim = new Date(turno.end);

        console.log("this.motorista", this.motorista)
        
        return turno.motorista === this.motorista?._id && agora >= inicio && agora <= fim;
      }) || null;

      console.log("turnoAtual:", this.turnoAtual)
      if (this.turnoAtual) {
        this.taxiService.getTaxiById(this.turnoAtual.taxi).subscribe({
          next: (taxi) => {
            this.taxi = taxi;
            this.carregarPedidosPendentes();
          },
          error: (err) => {
            console.error('Error getting taxi id:', err);
            this.loading = false;
          }
        });
      } else {
        this.loading = false;
      }
      console.log("turnoAtual:", this.turnoAtual)
    } catch (error) {
      console.error('Error in carregarTurnoAtual:', error);
    }
  }
  
  async carregarPedidosPendentes() {
    try {
      this.clienteEnderecos.clear();
      this.destinoEnderecos.clear();
      this.distanciasCliente.clear();
      this.temposChegada.clear();
      this.distanciasViagem.clear();
      this.temposViagem.clear();
      this.temposTotais.clear();
      
      const pedidos = await firstValueFrom(this.pedidoViagemService.getPedidos()) || [];
      let pedidosFiltrados = pedidos.filter(pedido => 
        !pedido.motoristaId && !(pedido.rejeitados && pedido.rejeitados.includes(this.motorista?._id))
      );
      
      // Process each pedido to calculate distance and times
      for (const pedido of pedidosFiltrados) {
        try {
          if (pedido.confort !== this.taxi.confort|| !pedido._id || !pedido.entryAddress || !pedido.exitAddress) continue;
          
          const [clientLat, clientLng] = pedido.entryAddress.split(',').map(coord => parseFloat(coord));
          const [destLat, destLng] = pedido.exitAddress.split(',').map(coord => parseFloat(coord));
          
          const distanceToClient = this.pedidoViagemService.calcularDistancia(
            this.currentPosition.latitude,
            this.currentPosition.longitude,
            clientLat,
            clientLng
          );
          
          const tripDistance = this.pedidoViagemService.calcularDistancia(
            clientLat,
            clientLng,
            destLat,
            destLng
          );
          
          const timeToReachClient = Math.ceil(distanceToClient * 4); // 4 min per km
          const tripTime = Math.ceil(tripDistance * 4);
          const totalTime = timeToReachClient + tripTime;
          
          this.distanciasCliente.set(pedido._id, distanceToClient);
          this.temposChegada.set(pedido._id, timeToReachClient);
          this.distanciasViagem.set(pedido._id, tripDistance);
          this.temposViagem.set(pedido._id, tripTime);
          this.temposTotais.set(pedido._id, totalTime);
          
          // Get human-readable addresses
          try {
            const clienteEndereco = await this.geolocationService.getAddressFromCoordinates(
              clientLat.toString(),
              clientLng.toString()
            );
            if (pedido._id && clienteEndereco !== null) {
              if (clienteEndereco) {
                this.clienteEnderecos.set(pedido._id, clienteEndereco);
              }
            }
            
            const destinoEndereco = await this.geolocationService.getAddressFromCoordinates(
              destLat.toString(),
              destLng.toString()
            );
            if (destinoEndereco !== null) {
              this.destinoEnderecos.set(pedido._id, destinoEndereco ?? 'Address not available');
            }
          } catch (addressError) {
            console.error('Error getting address:', addressError);
          }
        } catch (err) {
          console.error(`Error processing pedido ${pedido._id}:`, err);
        }
      }
      
      // Filter pedidos that can be completed within current turno
      if (this.turnoAtual) {
        const agora = new Date();
        const fimTurno = new Date(this.turnoAtual.end);
        const minutosRestantes = Math.floor((fimTurno.getTime() - agora.getTime()) / 60000);
        
        pedidosFiltrados = pedidosFiltrados.filter(pedido => 
          pedido._id && this.temposTotais.get(pedido._id) !== undefined && 
          (this.temposTotais.get(pedido._id) || 0) <= minutosRestantes
        );
      }
      
      // Sort by distance to motorista
      this.pedidosPendentes = pedidosFiltrados.sort((a, b) => {
        const distA = a._id ? (this.distanciasCliente.get(a._id) || 0) : 0;
        const distB = b._id ? (this.distanciasCliente.get(b._id) || 0) : 0;
        return distA - distB;
      });
      
      this.loading = false;
    } catch (error) {
      console.error('Error in carregarPedidosPendentes:', error);
      this.erro = 'Error loading pending ride requests';
      this.loading = false;
    }


  }  async onAceitarPedido(pedido: PedidoViagem) {
    console.log("pedido:", pedido)
    try {
      if (!pedido._id || !this.motorista || !this.precos) {
        throw new Error('Driver or pricing data not available');
      }
      
      const tripTime = this.temposViagem.get(pedido._id) || 0;
      const timeToReachClient = this.temposChegada.get(pedido._id) || 0;
      const tempoEstimadoMin = timeToReachClient + tripTime;
      const distanciaKmToMotorista = this.distanciasCliente.get(pedido._id) || 0;

      
      // Calculate estimated cost
      const pricePerMinute = pedido.confort === 'Basic' 
        ? this.precos.pricePerMinuteConfort 
        : this.precos.pricePerMinuteLuxury;
      
      const custoEstimado = Math.round(tripTime * pricePerMinute * 100) / 100;

    this.pedidoViagemService.acceptMotorista(
      pedido._id,
      this.motorista?._id, 
      this.taxi?._id,
      distanciaKmToMotorista
    ).subscribe({
        next: (motoristaId) => {
          alert('Request accepted! Waiting for client confirmation.');
          console.log("response:", motoristaId)
          this.pedidoViagemService.clientConfirm(pedido._id!).subscribe({
            next: (res: any) => {
              console.log(res);
              if (res && res.confirmed) {
                console.log("accepted");
                this.router.navigate([`/motorista/pedido-aceito/${pedido._id}`]);
              } else if (res && res.rejected) {
                alert('The client rejected or cancelled the request.');
                this.carregarPedidosPendentes();
              } else {
                alert('The client did not respond within the time limit.');
                this.carregarPedidosPendentes();
              }
            },
            error: (err) => {
              console.error('Error requesting driver:', err);
            }
          });
          
        },
        error: (err) => {
          console.error('Error while waiting for driver:', err);
        }
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Error accepting the request. Please try again.');
    }
  }

  getDistanciaCliente(pedidoId: string): number {
    return this.distanciasCliente.get(pedidoId) || 0;
  }
  
  getTempoChegada(pedidoId: string): number {
    return this.temposChegada.get(pedidoId) || 0;
  }
  
  getDistanciaViagem(pedidoId: string): number {
    return this.distanciasViagem.get(pedidoId) || 0;
  }
  
  getTempoViagem(pedidoId: string): number {
    return this.temposViagem.get(pedidoId) || 0;
  }
  
  getTempoTotal(pedidoId: string): number {
    return this.temposTotais.get(pedidoId) || 0;
  }
  
  getClienteEndereco(pedidoId: string): string {
    return this.clienteEnderecos.get(pedidoId) || 'Address not available';
  }
  
  getDestinoEndereco(pedidoId: string): string {
    return this.destinoEnderecos.get(pedidoId) || 'Address not available';
  }
  
  get temTurnoAtivo(): boolean {
    return this.turnoAtual !== null;
  }
  
  // Returns remaining shift time in minutes
  get tempoRestanteTurno(): number {
    if (!this.turnoAtual) return 0;
    
    const agora = new Date();
    const fimTurno = new Date(this.turnoAtual.end);
    return Math.floor((fimTurno.getTime() - agora.getTime()) / 60000);
  }

  voltarPaginaAnterior() {
    if (this.motoristaNIF) {
      this.router.navigate([`/motorista/${this.motoristaNIF}`]);
    } else {
      console.error('Driver NIF is not available.');
      alert('Error returning to previous page. NIF not found.');
      this.router.navigate(['/motorista']);
    }
  }
}  