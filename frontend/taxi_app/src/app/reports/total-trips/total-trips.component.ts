import { Component } from '@angular/core';
import { ReportStateService } from '../../appServices/report-state.service';
import { Trip } from '../../trips/trip.interface';

@Component({
  selector: 'app-total-viagens',
  templateUrl: './total-trips.component.html',
  styleUrls: ['./total-trips.component.css']
})
export class TotalTripsComponent {
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

  getKmsArredondado(kms: number) : number{
    return parseFloat(kms.toFixed(2))
  }

  getTime(data: Date): string {
    const d = new Date(data);
    const hora = d.getHours();
    const minutos = d.getMinutes();

    return `${hora}:${minutos}`;
}


}
