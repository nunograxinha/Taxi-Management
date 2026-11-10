import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Viagem } from '../viagem/viagem_interface';
import { ViagemService } from '../appServices/viagem.service';
import { Motorista } from '../motoristas/motorista_interface';
import { MotoristaService } from './motorista.service';

@Injectable({
  providedIn: 'root'
})
export class RelatorioStateService {
  private _viagensHoje$: BehaviorSubject<Viagem[]> = new BehaviorSubject<Viagem[]>([]); //todas as viagens
  private _viagensPorMotoristaHoje$: BehaviorSubject<Map<string, Viagem[]>> = new BehaviorSubject(new Map()); //id_motorista -> viagens
  private _motoristasMap: Map<string, Motorista> = new Map(); //id_motorista -> motorista


  constructor(private viagemService: ViagemService, private motoristaService: MotoristaService
) {
    this.atualizarViagens();
    this.atualizarMotoristas();
  }

  atualizarViagens(): void {
    this.viagemService.listarTodasViagens().subscribe({
      next: (viagens) => {
        const viagensHoje = this.filtrarViagensDeHoje(viagens);
        this._viagensHoje$.next(viagensHoje);
        this._viagensPorMotoristaHoje$.next(this.gerarMapa(viagensHoje));
        console.log("Lista das viagens de hoje:", this._viagensHoje$.getValue()); //
      },
      error: (err) => {
        console.error('Erro ao buscar viagens:', err);
      }
    });
  }

  private atualizarMotoristas(): void {
    this.motoristaService.obterMotoristas().subscribe({
      next: (motoristas: Motorista[]) => {
        motoristas.forEach(m => this._motoristasMap.set(m._id!, m));
        console.log("Mapa dos motoristas preenchido:", this._motoristasMap); //
      },
      error: (err) => {
        console.error('Erro ao buscar motoristas:', err);
      }
    });
  }

  private filtrarViagensDeHoje(viagens: Viagem[]): Viagem[] {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const dia = hoje.getDate();

    return viagens.filter(v => {
      const data = new Date(v.entryTime);
      return (
        data.getFullYear() === ano &&
        data.getMonth() === mes &&
        data.getDate() === dia
      );
    });
  }

  private gerarMapa(viagens: Viagem[]): Map<string, Viagem[]> {
    const mapa = new Map<string, Viagem[]>();
    for (const viagem of viagens) {
      const motoristaId = typeof viagem.motorista === 'object' && viagem.motorista !== null
      ? (viagem.motorista as any)._id
      : viagem.motorista;
      const lista = mapa.get(motoristaId) || [];
      lista.push(viagem);
      mapa.set(motoristaId, lista);
    }
    return mapa;
  }

  getViagensHoje$(): Observable<Viagem[]> {
    return this._viagensHoje$.asObservable();
  }

  getViagensPorMotoristaHoje$(): Observable<Map<string, Viagem[]>> {
    return this._viagensPorMotoristaHoje$.asObservable();
  }

 getMotorista(id: string) : Motorista | undefined {
    return this._motoristasMap.get(id);
  }

  calcularTotalHoras(viagens: Viagem[]): number {
    let totalMs = 0;

    for (const viagem of viagens) {
      const entrada = new Date(viagem.entryTime).getTime();
      const saida = new Date(viagem.exitTime).getTime();
      totalMs += (saida - entrada);
    }

    const totalHoras = totalMs / (1000 * 60 * 60);
    return parseFloat(totalHoras.toFixed(2));
  }

  calcularTotalKm(viagens: Viagem[]): number {
    const totalKm = viagens.reduce((soma, viagem) => soma + viagem.distanceKm, 0);
    return parseFloat(totalKm.toFixed(2));
  }
}
