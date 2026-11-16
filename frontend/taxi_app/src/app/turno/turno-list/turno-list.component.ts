import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TurnoService } from '../../appServices/turno.service';
import { Turno } from '../turno_interface';
import { TaxiService } from '../../appServices/taxi.service';
import { Taxi } from '../../taxis/taxi_interface';

@Component({
  selector: 'app-turno-list',
  templateUrl: './turno-list.component.html',
  styleUrls: ['./turno-list.component.css']
})
export class TurnoListComponent {
  motoristaNif!: string;
  turnos: Turno[] = [];
  taxiMap = new Map<string, string>();

  constructor(
    private route: ActivatedRoute,
    private turnoService: TurnoService,
    private taxiService: TaxiService
  ) {}  

  ngOnInit(): void {
    this.motoristaNif = this.route.snapshot.paramMap.get('nif')!;

    this.turnoService.getTurnosByMotoristaNIF(this.motoristaNif).subscribe({
      next: (turnos: Turno[]) => {
        this.turnos = turnos.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
        const taxiIds = Array.from(new Set(turnos.map(t => t.taxi)));
        this.taxiService.getTaxis().subscribe({
          next: (taxis: Taxi[]) => {
            taxis.forEach(taxi => {
              if (taxi._id) {
                this.taxiMap.set(taxi._id, `${taxi.brand} ${taxi.model} (${taxi.licensePlate})`);
              }
            });
          },
          error: (err) => console.error('Error fetching taxis:', err),
        });
      },
      error: (err: any) => {
        console.error('Error fetching shifts:', err);

      }
    
    });
  }

  getTaxiInfo(taxiId: string): string {
    return this.taxiMap.get(taxiId) || 'Taxi not found';
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
}
