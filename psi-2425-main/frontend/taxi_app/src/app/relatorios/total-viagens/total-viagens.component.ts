import { Component } from '@angular/core';
import { RelatorioStateService } from '../../appServices/relatorio-state.service';
import { Viagem } from '../../viagem/viagem_interface';

@Component({
  selector: 'app-total-viagens',
  templateUrl: './total-viagens.component.html',
  styleUrls: ['./total-viagens.component.css']
})
export class TotalViagensComponent {
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
