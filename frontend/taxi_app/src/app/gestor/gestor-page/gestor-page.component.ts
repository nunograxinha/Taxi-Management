import { Component } from '@angular/core';
import { TaxiService } from '../../appServices/taxi.service';
import { MotoristaService } from '../../appServices/motorista.service';

@Component({
  selector: 'app-gestor-page',
  templateUrl: './gestor-page.component.html',
  styleUrls: ['./gestor-page.component.css']
})
export class GestorPageComponent {
  taxis: any[] = [];
  motoristas: any[] = [];

  

  constructor(private taxiService: TaxiService ,
    private motoristaService: MotoristaService
  ) {}

  ngOnInit(): void {
    this.carregarTaxis();
    this.carregarMotoristas();
   }

  onClose() {
    console.log('Menu closed');
  }

  private carregarTaxis(): void {
    this.taxiService.getTaxis().subscribe({
      next: (data) => {
        this.taxis = data;
      },
      error: (err) => {
        console.error('Error fetching taxis:', err);
      }
    });
  }

    private carregarMotoristas(): void {
    this.motoristaService.obterMotoristas().subscribe({
      next: (data) => {
        this.motoristas = data;
      },
      error: (err) => {
        console.error('Error fetching drivers:', err);
      }
    });
  }

  get totalTaxis(): number {
    return this.taxis.length;
  }

  get totalMotoristas(): number {
    return this.motoristas.length;
  }
}
