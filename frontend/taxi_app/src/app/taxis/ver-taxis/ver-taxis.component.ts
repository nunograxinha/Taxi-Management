import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TaxiService } from '../../appServices/taxi.service';

@Component({
  selector: 'app-ver-taxis',
  templateUrl: './ver-taxis.component.html',
  styleUrls: ['./ver-taxis.component.css']
})
export class VerTaxisComponent implements OnInit, OnChanges{
  @Input() refreshTrigger!: number;

  taxis: any[] = [];

  constructor(private taxiService: TaxiService) {}

  ngOnInit(): void {
   this.carregarTaxis();
  }

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['refreshTrigger']) {
        this.carregarTaxis();
      }
    }

    private carregarTaxis(): void {
      this.taxiService.getTaxis().subscribe({
        next: (data) => {
          this.taxis = this.sortTaxisByUpdatedAt(data);
        },
        error: (err) => {
          console.error('Error fetching taxis:', err);
        }
      });
    }

    private sortTaxisByUpdatedAt(taxis: any[]): any[] {
      return [...taxis].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    removerTaxi(taxi: any) {
      if (confirm(`Are you sure you want to remove taxi ${taxi.licensePlate}?`)) {
        this.taxiService.deleteTaxiByLicensePlate(taxi.licensePlate).subscribe({
          next: () => {
            this.carregarTaxis();
            alert('Taxi removed successfully!');
          },
          error: (err) => {
            alert(err.error?.error || 'Could not remove the taxi.');          }
        });
      }
    }
}
