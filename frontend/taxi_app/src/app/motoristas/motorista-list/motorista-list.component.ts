import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MotoristaService } from '../../appServices/motorista.service';

@Component({
  selector: 'app-motorista-list',
  templateUrl: './motorista-list.component.html',
  styleUrls: ['./motorista-list.component.css']
})
export class MotoristaListComponent implements OnInit, OnChanges {
  @Input() refreshTrigger!: number;

  motoristas: any[] = [];

  constructor(private readonly motoristaService: MotoristaService) {}

  ngOnInit(): void {
    this.carregarMotoristas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.carregarMotoristas();
    }
  }

  private carregarMotoristas(): void {
    this.motoristaService.obterMotoristas().subscribe({
      next: (data) => {
        this.motoristas = this.motoristaService.sortMotoristasByUpdatedAt(data);
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
      }
    });
  } 

  removerMotorista(motorista: any) {
    if (confirm(`Are you sure you want to remove driver ${motorista.name}?`)) {
      this.motoristaService.apagarMotoristaPorNIF(motorista.NIF).subscribe({
        next: () => {
          this.carregarMotoristas();
          alert('Driver removed successfully!');
        },
        error: (err) => {
          alert(err.error?.error || 'Could not remove the driver.');
        }
      });
    }
  }

}