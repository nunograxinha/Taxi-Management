import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { PedidoViagemService } from '../../appServices/ride-request.service';
import { SocketService } from '../../appServices/socket.service';
import { PedidoViagem } from '../ride-request.interface';
import { ActivatedRoute } from '@angular/router';
import { GeolocationService } from '../../appServices/geolocation.service';
import { MotoristaService } from '../../appServices/driver.service';
import { TaxiService } from '../../appServices/taxi.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acompanhar-viagem',
  templateUrl: './track-trip.component.html',
  styleUrls: ['./track-trip.component.css']
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
  private trackMap: L.Map | null = null;
  private taxiMarker: L.Marker | null = null;
  private mapInitialized: boolean = false;
  private pendingTaxiLocation: { lat: number; lon: number; heading: number } | null = null;
  hasLiveTaxiLocation: boolean = false;


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

    this.subscriptions.add(
      this.socketService
        .onEvent<{ pedidoId: string; lat: number; lon: number; heading?: number | null }>('driver:location')
        .subscribe((loc) => {
          if (loc && String(loc.pedidoId) === String(this.pedidoId)) {
            this.updateTaxiMarker(loc.lat, loc.lon, loc.heading || 0);
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
      this.destroyTrackMap();
    }

    if (this.status !== 'finalizada' && !this.mapInitialized && res.entryAddress && res.exitAddress) {
      this.initTrackMap(res.entryAddress, res.exitAddress);
    }
  }

  ngOnDestroy() {
    this.destroyTrackMap();
    if (this.pedidoId) {
      this.socketService.leavePedido(this.pedidoId);
    }
    this.subscriptions.unsubscribe();
  }

  private destroyTrackMap(): void {
    if (this.trackMap) {
      this.trackMap.remove();
      this.trackMap = null;
      this.taxiMarker = null;
      this.mapInitialized = false;
    }
  }

  private parseCoords(raw: string): [number, number] | null {
    if (!raw || !raw.includes(',')) return null;
    const [latStr, lonStr] = raw.split(',').map(s => s.trim());
    const lat = Number(latStr);
    const lon = Number(lonStr);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
  }

  private initTrackMap(entryAddress: string, exitAddress: string): void {
    const pickup = this.parseCoords(entryAddress);
    const dest = this.parseCoords(exitAddress);
    if (!pickup || !dest) return;

    this.mapInitialized = true;
    setTimeout(async () => {
      const container = document.getElementById('clientTrackMap');
      if (!container || this.trackMap) return;

      this.trackMap = L.map(container, {
        center: [(pickup[0] + dest[0]) / 2, (pickup[1] + dest[1]) / 2],
        zoom: 13
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.trackMap);

      const makePin = (color: string) =>
        L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

      L.marker([pickup[0], pickup[1]], { icon: makePin('#16a34a') })
        .bindPopup('Pickup')
        .addTo(this.trackMap);

      L.marker([dest[0], dest[1]], { icon: makePin('#dc2626') })
        .bindPopup('Destination')
        .addTo(this.trackMap);

      const bounds = L.latLngBounds([pickup, dest]);
      this.trackMap.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });

      if (this.pendingTaxiLocation) {
        this.updateTaxiMarker(
          this.pendingTaxiLocation.lat,
          this.pendingTaxiLocation.lon,
          this.pendingTaxiLocation.heading
        );
        this.pendingTaxiLocation = null;
      } else if (this.status === 'emCurso') {
        this.updateTaxiMarker(pickup[0], pickup[1], 0, false);
      }

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
        const resp = await fetch(osrmUrl);
        const data = await resp.json();
        const coords: [number, number][] = data?.routes?.[0]?.geometry?.coordinates || [];
        if (coords.length >= 2 && this.trackMap) {
          const routeLatLngs: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
          L.polyline(routeLatLngs, { color: '#1d4ed8', weight: 8, opacity: 0.9 }).addTo(this.trackMap);
          L.polyline(routeLatLngs, { color: '#3b82f6', weight: 4.5, opacity: 1 }).addTo(this.trackMap);
          this.trackMap.fitBounds(L.latLngBounds(routeLatLngs), { padding: [45, 45], maxZoom: 15 });
        }
      } catch (err) {
        console.warn('Could not load OSRM route for client map:', err);
      }

      setTimeout(() => this.trackMap?.invalidateSize(), 100);
    }, 80);
  }

  private updateTaxiMarker(lat: number, lon: number, heading: number, isLive: boolean = true): void {
    if (!this.trackMap) {
      if (isLive) {
        this.pendingTaxiLocation = { lat, lon, heading };
      }
      return;
    }
    if (isLive) {
      this.hasLiveTaxiLocation = true;
    }

    const taxiIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));">🚕</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (!this.taxiMarker) {
      this.taxiMarker = L.marker([lat, lon], { icon: taxiIcon })
        .bindPopup('Your Taxi')
        .addTo(this.trackMap);
    } else {
      this.taxiMarker.setLatLng([lat, lon]);
    }
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
        this.router.navigate(['/client']);
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
    this.router.navigate(['/client']);
  }

}
