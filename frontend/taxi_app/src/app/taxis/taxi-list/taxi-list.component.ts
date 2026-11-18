import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaxiService } from '../../appServices/taxi.service';
import { getTaxiCarImage } from '../../appServices/taxi-icon.util';

@Component({
  selector: 'app-ver-taxis',
  standalone: false,
  templateUrl: './taxi-list.component.html',
  styleUrls: ['./taxi-list.component.css']
})
export class TaxiListComponent implements OnInit, OnChanges {
  @Input() refreshTrigger!: number;

  taxis: any[] = [];
  searchTerm: string = '';
  comfortFilter: 'All' | 'Basic' | 'Luxury' = 'All';
  comfortMenuOpen: boolean = false;
  seatFilter: number | 'All' = 'All';
  seatMenuOpen: boolean = false;
  readonly comfortOptions: Array<{ value: 'All' | 'Basic' | 'Luxury'; label: string }> = [
    { value: 'All', label: 'All Comforts' },
    { value: 'Basic', label: 'Basic' },
    { value: 'Luxury', label: 'Luxury' }
  ];
  isLoading: boolean = false;
  loadError: string = '';

  constructor(
    private taxiService: TaxiService,
    private snackBar: MatSnackBar,
    private elementRef: ElementRef,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.comfortMenuOpen = false;
      this.seatMenuOpen = false;
    }
  }

  toggleComfortMenu(event: Event): void {
    event.stopPropagation();
    this.seatMenuOpen = false;
    this.comfortMenuOpen = !this.comfortMenuOpen;
  }

  selectComfort(value: 'All' | 'Basic' | 'Luxury'): void {
    this.comfortFilter = value;
    this.comfortMenuOpen = false;
  }

  toggleSeatMenu(event: Event): void {
    event.stopPropagation();
    this.comfortMenuOpen = false;
    this.seatMenuOpen = !this.seatMenuOpen;
  }

  selectSeat(value: number | 'All'): void {
    this.seatFilter = value;
    this.seatMenuOpen = false;
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  get seatOptions(): Array<{ value: number | 'All'; label: string }> {
    const capacities = Array.from(
      new Set(this.taxis.map(t => Number(t.passengerCapacity) || 4))
    ).sort((a, b) => a - b);
    return [
      { value: 'All', label: 'All Seats' },
      ...capacities.map(c => ({ value: c, label: `${c} seats` }))
    ];
  }

  get selectedSeatLabel(): string {
    return this.seatFilter === 'All' ? 'All Seats' : `${this.seatFilter} seats`;
  }

  get selectedComfortLabel(): string {
    return this.comfortOptions.find(o => o.value === this.comfortFilter)?.label || 'All Comforts';
  }

  getCarImage(taxi: any): string {
    return getTaxiCarImage(taxi?.brand, taxi?.model);
  }

  editTaxi(taxi: any): void {
    this.router.navigate(['/manager/edit-taxi', taxi.licensePlate]);
  }

  formatUpdatedAt(value: string | Date): string {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  ngOnInit(): void {
    this.loadTaxis();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.loadTaxis();
    }
  }

  loadTaxis(): void {
    this.isLoading = true;
    this.loadError = '';
    this.taxiService.getTaxis().subscribe({
      next: (data) => {
        this.taxis = this.sortTaxisByUpdatedAt(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching taxis:', err);
        this.loadError = 'Could not load taxis. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get filteredTaxis(): any[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.taxis.filter(taxi => {
      const matchesComfort = this.comfortFilter === 'All' || taxi.confort === this.comfortFilter;
      if (!matchesComfort) return false;
      const matchesSeats = this.seatFilter === 'All' || (Number(taxi.passengerCapacity) || 4) === this.seatFilter;
      if (!matchesSeats) return false;
      if (!query) return true;
      return (
        (taxi.licensePlate || '').toLowerCase().includes(query) ||
        (taxi.brand || '').toLowerCase().includes(query) ||
        (taxi.model || '').toLowerCase().includes(query)
      );
    });
  }

  private sortTaxisByUpdatedAt(taxis: any[]): any[] {
    return [...taxis].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  removeTaxi(taxi: any): void {
    if (confirm(`Are you sure you want to remove taxi ${taxi.licensePlate}?`)) {
      this.taxiService.deleteTaxiByLicensePlate(taxi.licensePlate).subscribe({
        next: () => {
          this.loadTaxis();
          this.snackBar.open('Taxi removed successfully!', 'Close', { duration: 3500 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Could not remove the taxi.', 'Close', { duration: 4000 });
        }
      });
    }
  }
}
