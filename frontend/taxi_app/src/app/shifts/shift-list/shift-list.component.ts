import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShiftService } from '../../appServices/shift.service';
import { Shift } from '../shift.interface';
import { TaxiService } from '../../appServices/taxi.service';
import { Taxi } from '../../taxis/taxi.interface';
import { AuthService } from '../../appServices/auth.service';

@Component({
  selector: 'app-turno-list',
  templateUrl: './shift-list.component.html',
  styleUrls: ['./shift-list.component.css']
})
export class ShiftListComponent {
  motoristaNif!: string;
  turnos: Shift[] = [];
  taxiMap = new Map<string, string>();

  constructor(
    private route: ActivatedRoute,
    private turnoService: ShiftService,
    private taxiService: TaxiService,
    private authService: AuthService
  ) {}  

  ngOnInit(): void {
    this.motoristaNif =
      this.authService.getDriverNif() ||
      this.route.snapshot.paramMap.get('nif') ||
      this.route.parent?.snapshot.paramMap.get('nif') ||
      '';

    this.turnoService.getShiftsByDriverNIF(this.motoristaNif).subscribe({
      next: (turnos: Shift[]) => {
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
