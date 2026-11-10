import { Component } from '@angular/core';
import { RelatorioStateService } from '../../appServices/relatorio-state.service';
import { Viagem } from '../../viagem/viagem_interface';

@Component({
  selector: 'app-total-horas',
  templateUrl: './total-horas.component.html',
  styleUrls: ['./total-horas.component.css']
})
export class TotalHorasComponent {
  viagensPorMotorista: { motoristaId: string; viagens: Viagem[] }[] = [];

  constructor(private relatorioState: RelatorioStateService) {}

    ngOnInit() {
    this.relatorioState.getViagensPorMotoristaHoje$().subscribe(mapa => {
      this.viagensPorMotorista = Array.from(mapa.entries()).map(([motoristaId, viagens]) => {
        console.log('motoristaId:', motoristaId);
        const motorista = this.relatorioState.getMotorista(motoristaId);
        console.log("motorista: ",motorista);
        return {
          motoristaId,
          viagens
        };
      });
    });
  }

  getNomeMotorista(id: string): string | "Erro ao carregar nome"{
    const motorista = this.relatorioState.getMotorista(id);
    console.log(motorista); //
    if(motorista != undefined){
      return motorista.name;
    } else {
      return "Erro ao carregar nome";
    }
  }

  getTime(data: Date): string {
    const d = new Date(data);
    const hora = d.getHours();
    const minutos = d.getMinutes();

    return `${hora}:${minutos}`;
}

  getIntervaloTempo(entryTime: Date, exitTime: Date): number {
    const entrada = new Date(entryTime).getTime();
    const saida = new Date(exitTime).getTime();

    const intervaloMs = saida - entrada;
    const intervaloHoras = intervaloMs / (1000 * 60 * 60);

    return parseFloat(intervaloHoras.toFixed(2)); // arredonda para 2 casas decimais
}

}
