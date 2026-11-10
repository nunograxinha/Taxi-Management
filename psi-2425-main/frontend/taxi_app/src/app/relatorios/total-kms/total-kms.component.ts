import { Component } from '@angular/core';
import { RelatorioStateService } from '../../appServices/relatorio-state.service';
import { Viagem } from '../../viagem/viagem_interface';

@Component({
  selector: 'app-total-kms',
  templateUrl: './total-kms.component.html',
  styleUrls: ['./total-kms.component.css']
})
export class TotalKmsComponent {
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

  getDate(data: Date): string {
    const d = new Date(data);
    const dia = d.getDate();
    const ano = d.getFullYear();
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const mes = meses[d.getMonth()];

    return `${dia} de ${mes}, ${ano}`;
}



}
