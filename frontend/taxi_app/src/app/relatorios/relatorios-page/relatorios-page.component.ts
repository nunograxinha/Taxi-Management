import { Component } from '@angular/core';
import { RelatorioStateService } from '../../appServices/relatorio-state.service';
import { ViagemService } from '../../appServices/viagem.service';
import { Viagem } from '../../viagem/viagem_interface';

@Component({
  selector: 'app-relatorios-page',
  templateUrl: './relatorios-page.component.html',
  styleUrls: ['./relatorios-page.component.css']
})
export class RelatoriosPageComponent {
  viagens: Viagem[] = [];
  viagensPorMotorista : [string, Viagem[]][] = [];
  motoristaViagensEntries: [string, Viagem[]][] = [];


  constructor(
      private relatorioState: RelatorioStateService
    ) {}

  ngOnInit() {
    this.relatorioState.atualizarViagens();

    this.relatorioState.getViagensPorMotoristaHoje$().subscribe(mapa => {
      this.viagensPorMotorista = Array.from(mapa.entries());
    });

    this.relatorioState.getViagensHoje$().subscribe(viagensArray => {
      this.viagens = viagensArray;
    });
  }

  calcularTotalHoras(): number {
      return this.relatorioState.calcularTotalHoras(this.viagens);
  }
  
  calcularTotalKm(): number {
      return this.relatorioState.calcularTotalKm(this.viagens);
  }
}