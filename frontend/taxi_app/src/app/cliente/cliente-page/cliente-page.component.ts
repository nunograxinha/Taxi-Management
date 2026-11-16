import { Component, OnInit } from '@angular/core';
import { Cliente } from '../cliente_interface';
import { ViagemService } from '../../appServices/viagem.service';
import { Viagem } from '../../viagem/viagem_interface';
import { GeolocationService } from '../../appServices/geolocation.service';

const CLIENT_STORAGE_KEY = 'clienteAtual';

@Component({
  selector: 'app-cliente-page',
  templateUrl: './cliente-page.component.html',
  styleUrls: ['./cliente-page.component.css']
})
export class ClientePageComponent implements OnInit {
  clienteSelecionado: Cliente | null = null;
  activeTab: 'request' | 'history' = 'request';
  tripHistory: Viagem[] = [];
  resolvedAddresses: Record<string, string> = {};
  isLoadingHistory: boolean = false;
  historyError: string = '';

  constructor(
    private viagemService: ViagemService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    const savedClient = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (savedClient) {
      try {
        this.clienteSelecionado = JSON.parse(savedClient);
      } catch {
        localStorage.removeItem(CLIENT_STORAGE_KEY);
      }
    }
  }

  onClienteCriado(cliente: Cliente) {
    this.clienteSelecionado = cliente;
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(cliente));
  }

  trocarCliente() {
    this.clienteSelecionado = null;
    this.activeTab = 'request';
    this.tripHistory = [];
    localStorage.removeItem(CLIENT_STORAGE_KEY);
  }

  setTab(tab: 'request' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadTripHistory();
    }
  }

  loadTripHistory(): void {
    if (!this.clienteSelecionado?._id) return;
    this.isLoadingHistory = true;
    this.historyError = '';

    this.viagemService.listarTodasViagens().subscribe({
      next: (trips) => {
        const clientId = String(this.clienteSelecionado?._id);
        this.tripHistory = (trips || [])
          .filter(t => {
            const tripClientId = typeof t.client === 'object' && t.client !== null
              ? (t.client as any)._id
              : t.client;
            return String(tripClientId) === clientId;
          })
          .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
        this.resolveTripAddresses(this.tripHistory);
        this.isLoadingHistory = false;
      },
      error: (err) => {
        if (err?.status === 404) {
          this.tripHistory = [];
        } else {
          this.historyError = 'Could not load trip history. Please try again.';
        }
        this.isLoadingHistory = false;
      }
    });
  }

  formatAddress(raw: string): string {
    return this.resolvedAddresses[raw] || raw;
  }

  isSameDay(a: Date | string, b: Date | string): boolean {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  private resolveTripAddresses(trips: Viagem[]): void {
    const rawSet = new Set<string>();
    trips.forEach(t => {
      if (t.entryAddress) rawSet.add(t.entryAddress);
      if (t.exitAddress) rawSet.add(t.exitAddress);
    });

    rawSet.forEach(raw => {
      if (this.geolocationService.isCoordinateString(raw) && !this.resolvedAddresses[raw]) {
        this.geolocationService.resolveDisplayAddress(raw).then(resolved => {
          this.resolvedAddresses[raw] = resolved;
        });
      }
    });
  }
}
