import { Component, OnInit } from '@angular/core';
import { TaxiService } from '../../appServices/taxi.service';
import { MotoristaService } from '../../appServices/motorista.service';
import { PrecoService } from '../../appServices/preco.service';
import { ViagemService } from '../../appServices/viagem.service';
import { Preco } from '../../gerir-precos/preco_interface';

@Component({
  selector: 'app-gestor-page',
  templateUrl: './gestor-page.component.html',
  styleUrls: ['./gestor-page.component.css']
})
export class GestorPageComponent implements OnInit {
  taxis: any[] = [];
  drivers: any[] = [];
  trips: any[] = [];
  price: Preco | null = null;

  constructor(
    private taxiService: TaxiService,
    private motoristaService: MotoristaService,
    private precoService: PrecoService,
    private viagemService: ViagemService
  ) {}

  ngOnInit(): void {
    this.loadTaxis();
    this.loadDrivers();
    this.loadPrice();
    this.loadTrips();
  }

  private loadTaxis(): void {
    this.taxiService.getTaxis().subscribe({
      next: (data) => {
        this.taxis = data || [];
      },
      error: (err) => {
        console.error('Error fetching taxis:', err);
      }
    });
  }

  private loadDrivers(): void {
    this.motoristaService.obterMotoristas().subscribe({
      next: (data) => {
        this.drivers = data || [];
      },
      error: (err) => {
        console.error('Error fetching drivers:', err);
      }
    });
  }

  private loadPrice(): void {
    this.precoService.getPreco().subscribe({
      next: (data) => {
        this.price = data;
      },
      error: (err) => {
        console.error('Error fetching prices:', err);
      }
    });
  }

  private loadTrips(): void {
    this.viagemService.listarTodasViagens().subscribe({
      next: (data: any[]) => {
        this.trips = data || [];
      },
      error: (err: any) => {
        console.error('Error fetching trips:', err);
      }
    });
  }

  get totalTaxis(): number {
    return this.taxis.length;
  }

  get basicTaxis(): number {
    return this.taxis.filter(t => t.confort === 'Basic').length;
  }

  get luxuryTaxis(): number {
    return this.taxis.filter(t => t.confort === 'Luxury').length;
  }

  get totalDrivers(): number {
    return this.drivers.length;
  }

  get totalTrips(): number {
    return this.trips.length;
  }
}
