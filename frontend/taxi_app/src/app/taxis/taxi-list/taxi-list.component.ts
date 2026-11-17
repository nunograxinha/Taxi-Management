import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaxiService } from '../../appServices/taxi.service';

@Component({
  selector: 'app-ver-taxis',
  templateUrl: './taxi-list.component.html',
  styleUrls: ['./taxi-list.component.css']
})
export class VerTaxisComponent implements OnInit, OnChanges {
  @Input() refreshTrigger!: number;

  taxis: any[] = [];
  searchTerm: string = '';
  comfortFilter: 'All' | 'Basic' | 'Luxury' = 'All';
  comfortMenuOpen: boolean = false;
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
    private elementRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.comfortMenuOpen = false;
    }
  }

  toggleComfortMenu(event: Event): void {
    event.stopPropagation();
    this.comfortMenuOpen = !this.comfortMenuOpen;
  }

  selectComfort(value: 'All' | 'Basic' | 'Luxury'): void {
    this.comfortFilter = value;
    this.comfortMenuOpen = false;
  }

  get selectedComfortLabel(): string {
    return this.comfortOptions.find(o => o.value === this.comfortFilter)?.label || 'All Comforts';
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
