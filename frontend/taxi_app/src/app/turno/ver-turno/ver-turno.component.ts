import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MotoristaService } from '../../appServices/motorista.service';
import { TurnoService } from '../../appServices/turno.service';
import { ViagemService } from '../../appServices/viagem.service';
import { Motorista } from '../../motoristas/motorista_interface';
import { Viagem } from '../../viagem/viagem_interface';
import { Turno } from '../turno_interface';
import { TaxiService } from '../../appServices/taxi.service';
import { Taxi } from '../../taxis/taxi_interface';
import { ClienteService } from '../../appServices/cliente.service';
import { Cliente } from '../../cliente/cliente_interface';

@Component({
  selector: 'app-ver-turno',
  templateUrl: './ver-turno.component.html',
  styleUrls: ['./ver-turno.component.css']
})
export class VerTurnoComponent implements OnInit, OnDestroy {
  motorista?: Motorista;
  turnos: Turno[] = [];
  viagens: Viagem[] = [];
  turnoAtual: Turno | undefined;
  viagensDoTurnoAtual: Viagem[] = [];
  semTurnos: boolean = false;
  loading: boolean = true;
  private subscription?: Subscription;

  constructor(
    private motoristaService: MotoristaService,
    private turnoService: TurnoService,
    private viagemService: ViagemService,
    private taxiService: TaxiService,
    private clienteService: ClienteService,
  ) {}

  ngOnInit() {
    this.subscription = this.motoristaService.motorista$.subscribe((m) => {
      if (m) {
        this.motorista = m;

        this.turnoService.getTurnosByMotoristaNIF(m.NIF!).subscribe({
          next: (turnos) => {
            this.turnos = turnos;
            console.log('Turnos do motorista:', this.turnos);
        
            this.semTurnos = this.turnos.length === 0;
        
            this.turnoAtual = this.getTurnoAtual();
            this.atualizarViagensDoTurnoAtual();
            this.loading = false;
            console.log(this.turnoAtual);
          },
          error: (err) => {
            this.loading = false;
            console.error('Erro ao buscar turnos:', err);
          }
        });

        this.viagemService.listarViagens(m._id!).subscribe({
          next: (viagens) => {
          this.viagens = viagens.sort((a, b) =>
            new Date(b.entryTime!).getTime() - new Date(a.entryTime!).getTime()
          );
          this.atualizarViagensDoTurnoAtual();
          },
          error: (err) => {
            console.error('Erro ao buscar viagens:', err);
          }
        });
      }
    });
  }

  private atualizarViagensDoTurnoAtual() {
  if (this.turnoAtual) {
    this.viagensDoTurnoAtual = this.viagens.filter(
      v => v.shift === this.turnoAtual!._id
    );
  } else {
    this.viagensDoTurnoAtual = [];
  }
}

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  getTurnoAtual(): Turno | undefined {
    const agora = new Date();
    console.log('Data atual:', agora.toISOString());
  
    for (const turno of this.turnos) {
      const inicio = new Date(turno.start);
      const fim = new Date(turno.end);
      console.log(`Turno: ${inicio.toISOString()} até ${fim.toISOString()}`);
  
      if (agora >= inicio && agora <= fim) {
        console.log('Turno atual encontrado:', turno);
        return turno;
      }
    }
  
    console.log('Nenhum turno atual encontrado.');
    return undefined;
  }

  taxiInfoMap = new Map<string, string>();

getTaxiInfo(taxiId: string): string {
  if (this.taxiInfoMap.has(taxiId)) {
    return this.taxiInfoMap.get(taxiId)!;
  } else {
    this.taxiInfoMap.set(taxiId, 'Loading...');
    this.taxiService.getTaxiById(taxiId).subscribe({
      next: (taxi) => {
        const info = taxi ? taxi.licensePlate : 'Taxi not found';
        this.taxiInfoMap.set(taxiId, info);
      },
      error: () => {
        this.taxiInfoMap.set(taxiId, 'Taxi not found');
      }
    });
    return 'Loading...';
  }
}


  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

}
