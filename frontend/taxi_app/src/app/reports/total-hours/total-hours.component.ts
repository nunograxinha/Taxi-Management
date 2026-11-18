import { Component } from '@angular/core';
import { ReportStateService } from '../../appServices/report-state.service';
import { Trip } from '../../trips/trip.interface';

@Component({
  selector: 'app-total-horas',
  templateUrl: './total-hours.component.html',
  styleUrls: ['./total-hours.component.css']
})
export class TotalHoursComponent {
  viagensPorMotorista: { motoristaId: string; viagens: Trip[] }[] = [];

  constructor(private relatorioState: ReportStateService) {}

    ngOnInit() {
    this.relatorioState.getViagensPorMotoristaHoje$().subscribe(mapa => {
      this.viagensPorMotorista = Array.from(mapa.entries()).map(([motoristaId, viagens]) => {
        console.log('motoristaId:', motoristaId);
        const motorista = this.relatorioState.getDriver(motoristaId);
        console.log("motorista: ",motorista);
        return {
          motoristaId,
          viagens
        };
      });
    });
  }

  getNomeMotorista(id: string): string {
    const motorista = this.relatorioState.getDriver(id);
    if(motorista != undefined){
      return motorista.name;
    } else {
      return "Error loading name";
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
