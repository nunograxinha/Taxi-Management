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
        console.error('Erro ao carregar motoristas:', err);
      }
    });
  } 

  removerMotorista(motorista: any) {
    if (confirm(`Tem a certeza que quer remover o Motorista ${motorista.name}?`)) {
      this.motoristaService.apagarMotoristaPorNIF(motorista.NIF).subscribe({
        next: () => {
          this.carregarMotoristas();
          alert('Motorista removido com sucesso!');
        },
        error: (err) => {
          alert(err.error?.error || 'Não foi possível remover o Motorista.');
        }
      });
    }
  }

}