import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { RideRequestService, SharedTripInfo } from '../../appServices/ride-request.service';
import { SocketService } from '../../appServices/socket.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { RideRequest } from '../ride-request.interface';
import { getTaxiCarImage } from '../../appServices/taxi-icon.util';

@Component({
  selector: 'app-share-trip',
  templateUrl: './share-trip.component.html',
  styleUrls: ['./share-trip.component.css']
})
export class ShareTripComponent implements OnInit, OnDestroy {
  loading = true;
  expired = false;
  errorMessage = '';
  trip: SharedTripInfo | null = null;
  status: 'waiting' | 'inProgress' = 'waiting';
  partidaNome = '';
  destinoNome = '';
  hasLiveTaxiLocation = false;

  private trackingRoom = '';
  private shareToken = '';
  private subscriptions = new Subscription();
  private trackMap: L.Map | null = null;
  private taxiMarker: L.Marker | null = null;
  private mapInitialized = false;
  private pendingTaxiLocation: { lat: number; lon: number } | null = null;

  constructor(
    private route: ActivatedRoute,
    private pedidoViagemService: RideRequestService,
    private socketService: SocketService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    const shareToken = this.route.snapshot.paramMap.get('shareToken');
    if (!shareToken) {
      this.loading = false;
      this.expired = true;
      this.errorMessage = 'Invalid share link.';
      return;
    }
    this.shareToken = shareToken;

    this.pedidoViagemService.getSharedTrip(shareToken).subscribe({
      next: (info) => {
        this.loading = false;
        this.trip = info;
        this.trackingRoom = info.trackingRoom;
        this.status = info.startTime ? 'inProgress' : 'waiting';
        this.resolveAddresses(info.entryAddress, info.exitAddress);
        if (info.taxiLocation) {
          this.pendingTaxiLocation = { lat: info.taxiLocation.lat, lon: info.taxiLocation.lon };
        }
        this.initTrackMap(info.entryAddress, info.exitAddress);
        this.listenLiveUpdates(info.trackingRoom);
      },
      error: (err) => {
        this.loading = false;
        this.expired = true;
        this.errorMessage =
          err?.error?.error || 'This shared trip link is invalid or has expired.';
      }
    });
  }

  private listenLiveUpdates(room: string): void {
    this.socketService.joinSharedTrip(this.shareToken, room);

    this.subscriptions.add(
      this.socketService.onEvent<RideRequest>('pedido:updated').subscribe((updated) => {
        if (!updated || String(updated._id) !== String(room)) return;
        if (updated.endTime) {
          this.expired = true;
          this.errorMessage = 'This shared trip link has expired because the trip has ended.';
          this.destroyTrackMap();
          return;
        }
        if (updated.startTime) {
          this.status = 'inProgress';
          if (this.trip) {
            this.trip.startTime = updated.startTime;
          }
        }
      })
    );

    this.subscriptions.add(
      this.socketService
        .onEvent<{ pedidoId: string; lat: number; lon: number }>('driver:location')
        .subscribe((loc) => {
          if (loc && String(loc.pedidoId) === String(room)) {
            this.updateTaxiMarker(loc.lat, loc.lon);
          }
        })
    );
  }

  private async resolveAddresses(entryAddress: string, exitAddress: string): Promise<void> {
    if (entryAddress) {
      const [lat, lon] = entryAddress.split(',');
      this.partidaNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
    }
    if (exitAddress) {
      const [lat, lon] = exitAddress.split(',');
      this.destinoNome = await this.geolocationService.getAddressFromCoordinates(lat, lon);
    }
  }

  private initTrackMap(entryAddress: string, exitAddress: string): void {
    if (this.mapInitialized) return;
    const [pLat, pLon] = entryAddress.split(',').map(Number);
    const [dLat, dLon] = exitAddress.split(',').map(Number);
    if (!Number.isFinite(pLat) || !Number.isFinite(pLon) || !Number.isFinite(dLat) || !Number.isFinite(dLon)) {
      return;
    }

    this.mapInitialized = true;
    setTimeout(async () => {
      const container = document.getElementById('sharedTrackMap');
      if (!container) {
        this.mapInitialized = false;
        return;
      }

      this.trackMap = L.map(container).setView([pLat, pLon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.trackMap);

      const pickupIcon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#10b981;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      const destIcon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([pLat, pLon], { icon: pickupIcon }).bindPopup('Pickup').addTo(this.trackMap);
      L.marker([dLat, dLon], { icon: destIcon }).bindPopup('Destination').addTo(this.trackMap);
      this.trackMap.fitBounds(L.latLngBounds([[pLat, pLon], [dLat, dLon]]), { padding: [36, 36] });

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pLon},${pLat};${dLon},${dLat}?overview=full&geometries=geojson`;
        const resp = await fetch(osrmUrl);
        const data = await resp.json();
        const coords: [number, number][] = data?.routes?.[0]?.geometry?.coordinates || [];
        if (coords.length >= 2 && this.trackMap) {
          const routeLatLngs: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
          const line = L.polyline(routeLatLngs, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(this.trackMap);
          this.trackMap.fitBounds(line.getBounds(), { padding: [36, 36] });
        }
      } catch (err) {
        console.warn('Could not load OSRM route for shared map:', err);
      }

      if (this.pendingTaxiLocation) {
        this.updateTaxiMarker(this.pendingTaxiLocation.lat, this.pendingTaxiLocation.lon);
        this.pendingTaxiLocation = null;
      } else if (this.status === 'inProgress') {
        this.updateTaxiMarker(pLat, pLon);
      }
      setTimeout(() => this.trackMap?.invalidateSize(), 100);
    }, 50);
  }

  private updateTaxiMarker(lat: number, lon: number): void {
    this.hasLiveTaxiLocation = true;
    if (!this.trackMap) {
      this.pendingTaxiLocation = { lat, lon };
      return;
    }
    const taxiIcon = L.divIcon({
      className: '',
      html: '<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));">🚕</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    if (!this.taxiMarker) {
      this.taxiMarker = L.marker([lat, lon], { icon: taxiIcon }).bindPopup('Taxi').addTo(this.trackMap);
    } else {
      this.taxiMarker.setLatLng([lat, lon]);
    }
  }

  private destroyTrackMap(): void {
    if (this.trackMap) {
      this.trackMap.remove();
      this.trackMap = null;
      this.taxiMarker = null;
      this.mapInitialized = false;
    }
  }

  get taxiCarImage(): string {
    return getTaxiCarImage(this.trip?.taxi?.brand, this.trip?.taxi?.model);
  }

  ngOnDestroy(): void {
    if (this.trackingRoom || this.shareToken) {
      this.socketService.leaveSharedTrip(this.trackingRoom);
    }
    this.subscriptions.unsubscribe();
    this.destroyTrackMap();
  }
}
