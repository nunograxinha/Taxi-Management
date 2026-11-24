import { Component, Input, NgZone, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DriverService } from '../../appServices/driver.service';
import { SocketService } from '../../appServices/socket.service';

@Component({
  selector: 'app-motorista-list',
  templateUrl: './driver-list.component.html',
  styleUrls: ['./driver-list.component.css']
})
export class DriverListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() refreshTrigger!: number;

  drivers: any[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  loadError: string = '';
  selectedReviewsDriver: any = null;
  private socketSub = new Subscription();

  constructor(
    private readonly motoristaService: DriverService,
    private readonly snackBar: MatSnackBar,
    private readonly socketService: SocketService,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
    this.socketSub.add(
      this.socketService
        .onEvent<{ driverId: string; ratingAverage: number; ratingCount: number }>('driver:ratingUpdated')
        .subscribe((ev) => {
          this.ngZone.run(() => {
            if (!ev) return;
            const match = this.drivers.find((d) => String(d._id) === String(ev.driverId));
            if (match) {
              match.ratingAverage = ev.ratingAverage;
              match.ratingCount = ev.ratingCount;
            }
          });
        })
    );
  }

  ngOnDestroy(): void {
    this.socketSub.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.loadDrivers();
    }
  }

  loadDrivers(): void {
    this.isLoading = true;
    this.loadError = '';
    this.motoristaService.getDrivers().subscribe({
      next: (data) => {
        this.drivers = this.motoristaService.sortDriversByUpdatedAt(data);
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

  openDriverReviews(driver: any): void {
    this.selectedReviewsDriver = driver;
  }

  closeDriverReviews(): void {
    this.selectedReviewsDriver = null;
  }

  removeDriver(driver: any): void {
    if (confirm(`Are you sure you want to remove driver ${driver.name}?`)) {
      this.motoristaService.deleteDriverByNIF(driver.NIF).subscribe({
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
