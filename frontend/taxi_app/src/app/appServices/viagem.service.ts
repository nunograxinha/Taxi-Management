import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Viagem } from '../viagem/viagem_interface';

@Injectable({
  providedIn: 'root'
})
export class ViagemService {
  private url = 'http://localhost:3073/viagem';

  constructor(private http: HttpClient) { }

  // Função para tratar erros e retornar um valor padrão
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`); // Log de erro
      return of(result as T); // Retorna um valor padrão em caso de erro
    };
  }

  //listar todas as viagens na BD
  listarTodasViagens(): Observable<any[]> {
    return this.http.get<Viagem[]>(`${this.url}/`).pipe(
      catchError(this.handleError<Viagem[]>('listarTodasViagens', []))
    );
}

  criarViagem(viagem: any): Observable<Viagem> {
    return this.http.post<Viagem>(this.url, viagem).pipe(
      catchError(this.handleError<Viagem>('criarViagem'))
    );
  }

  // Listar todas as viagens do motorista
  listarViagens(motoristaId: string): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.url}/motorista/${motoristaId}`).pipe(
      catchError(this.handleError<Viagem[]>('listarViagens', []))
    );
  }

  // Obter os detalhes de uma viagem específica
  detalharViagem(viagemId: string): Observable<Viagem | null> {
    const url = `${this.url}/get/${viagemId}`;
    return this.http.get<Viagem>(url).pipe(
      catchError(this.handleError<Viagem>('detalharViagem', null!))
    );
  }

  // Aceitar um pedido de viagem
  aceitarPedido(viagemId: string, motoristaId: string): Observable<Viagem> {
    const url = `${this.url}/update/${viagemId}`;
    const body = { motorista: motoristaId };
    
    return this.http.put<Viagem>(url, body).pipe(
      catchError(this.handleError<Viagem>('aceitarPedido'))
    );
  }

  // Registar uma viagem (quando o cliente entra no táxi)
registarViagem(viagemId: string): Observable<Viagem> {
  const url = `${this.url}/update/${viagemId}`;
  
  const payload = {
    entryTime: new Date()
  };
  
  return this.http.put<Viagem>(url, payload).pipe(
    catchError(this.handleError<Viagem>('registarViagem'))
  );
}

// Finalizar uma viagem (registrar o fim da viagem)
finalizarViagem(viagemId: string): Observable<Viagem> {
  const url = `${this.url}/update/${viagemId}`;
  
  const payload = {
    exitTime: new Date()
  };
  
  return this.http.put<Viagem>(url, payload).pipe(
    catchError(this.handleError<Viagem>('finalizarViagem'))
  );
}

  recusarViagem(viagemId: string): Observable<any> {
    const url = `${this.url}/delete/${viagemId}`;
    return this.http.delete<Viagem>(url).pipe(
      catchError(this.handleError<Viagem>('recusarViagem'))
    );
  }
}
