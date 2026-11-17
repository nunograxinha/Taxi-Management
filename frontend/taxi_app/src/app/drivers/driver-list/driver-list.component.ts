import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MotoristaService } from '../../appServices/driver.service';

@Component({
  selector: 'app-motorista-list',
  templateUrl: './driver-list.component.html',
  styleUrls: ['./driver-list.component.css']
})
export class MotoristaListComponent implements OnInit, OnChanges {
  @Input() refreshTrigger!: number;

  drivers: any[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  loadError: string = '';

  constructor(
    private readonly motoristaService: MotoristaService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.loadDrivers();
    }
  }

  loadDrivers(): void {
    this.isLoading = true;
    this.loadError = '';
    this.motoristaService.obterMotoristas().subscribe({
      next: (data) => {
        this.drivers = this.motoristaService.sortMotoristasByUpdatedAt(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
        this.loadError = 'Could not load drivers. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get filteredDrivers(): any[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.drivers;
    return this.drivers.filter(driver =>
      (driver.name || '').toLowerCase().includes(query) ||
      (driver.NIF || '').toLowerCase().includes(query) ||
      (driver.drivingLicenseNumber || '').toLowerCase().includes(query)
    );
  }

  removeDriver(driver: any): void {
    if (confirm(`Are you sure you want to remove driver ${driver.name}?`)) {
      this.motoristaService.apagarMotoristaPorNIF(driver.NIF).subscribe({
        next: () => {
          this.loadDrivers();
          this.snackBar.open('Driver removed successfully!', 'Close', { duration: 3500 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Could not remove the driver.', 'Close', { duration: 4000 });
        }
      });
    }
  }
}
