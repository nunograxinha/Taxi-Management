import { Component, OnInit } from '@angular/core';
import { TaxiService } from '../../appServices/taxi.service';
import { DriverService } from '../../appServices/driver.service';
import { PriceService } from '../../appServices/price.service';
import { TripService } from '../../appServices/trip.service';
import { Price } from '../../manage-prices/price.interface';

@Component({
  selector: 'app-gestor-page',
  templateUrl: './manager-page.component.html',
  styleUrls: ['./manager-page.component.css']
})
export class ManagerPageComponent implements OnInit {
  taxis: any[] = [];
  drivers: any[] = [];
  trips: any[] = [];
  price: Price | null = null;

  constructor(
    private taxiService: TaxiService,
    private motoristaService: DriverService,
    private precoService: PriceService,
    private viagemService: TripService
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
    this.motoristaService.getDrivers().subscribe({
      next: (data) => {
        this.drivers = data || [];
      },
      error: (err) => {
        console.error('Error fetching drivers:', err);
      }
    });
  }

  private loadPrice(): void {
    this.precoService.getPrice().subscribe({
      next: (data) => {
        this.price = data;
      },
      error: (err) => {
        console.error('Error fetching prices:', err);
      }
    });
  }

  private loadTrips(): void {
    this.viagemService.getAllTrips().subscribe({
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
