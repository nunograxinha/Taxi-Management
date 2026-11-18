import { Component } from '@angular/core';
import { ReportStateService } from '../../appServices/report-state.service';
import { Trip } from '../../trips/trip.interface';

@Component({
  selector: 'app-total-kms',
  templateUrl: './total-kms.component.html',
  styleUrls: ['./total-kms.component.css']
})
export class TotalKmsComponent {
viagensPorMotorista: { motoristaId: string; viagens: Trip[] }[] = [];

  constructor(private relatorioState: ReportStateService) {}

    ngOnInit() {
    this.relatorioState.getViagensPorMotoristaHoje$().subscribe(mapa => {
      this.viagensPorMotorista = Array.from(mapa.entries()).map(([motoristaId, viagens]) => {
        console.log('driverId:', motoristaId);
        const motorista = this.relatorioState.getDriver(motoristaId);
        console.log('driver:', motorista);
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

  getDate(data: Date): string {
    const d = new Date(data);
    const dia = d.getDate();
    const ano = d.getFullYear();
    const meses = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const mes = meses[d.getMonth()];

    return `${mes} ${dia}, ${ano}`;
}



}
