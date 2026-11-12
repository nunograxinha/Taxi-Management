import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Viagem } from '../viagem/viagem_interface';

@Injectable({
  providedIn: 'root'
})
export class ViagemService {
  private url = 'http://localhost:3073/trip';

  constructor(private http: HttpClient) { }

  // Handle errors and return a default value
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  // List all trips in DB
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

  // List all trips for a driver
  listarViagens(motoristaId: string): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.url}/driver/${motoristaId}`).pipe(
      catchError(this.handleError<Viagem[]>('listarViagens', []))
    );
  }

  // Get details of a specific trip
  detalharViagem(viagemId: string): Observable<Viagem | null> {
    const url = `${this.url}/${viagemId}`;
    return this.http.get<Viagem>(url).pipe(
      catchError(this.handleError<Viagem>('detalharViagem', null!))
    );
  }

  // Accept a ride request
  aceitarPedido(viagemId: string, motoristaId: string): Observable<Viagem> {
    const url = `${this.url}/${viagemId}`;
    const body = { motorista: motoristaId };
    
    return this.http.put<Viagem>(url, body).pipe(
      catchError(this.handleError<Viagem>('aceitarPedido'))
    );
  }

  // Register a trip (when the client enters the taxi)
registarViagem(viagemId: string): Observable<Viagem> {
  const url = `${this.url}/${viagemId}`;
  
  const payload = {
    entryTime: new Date()
  };
  
  return this.http.put<Viagem>(url, payload).pipe(
    catchError(this.handleError<Viagem>('registarViagem'))
  );
}

// Finish a trip (register the end of the trip)
finalizarViagem(viagemId: string): Observable<Viagem> {
  const url = `${this.url}/${viagemId}`;
  
  const payload = {
    exitTime: new Date()
  };
  
  return this.http.put<Viagem>(url, payload).pipe(
    catchError(this.handleError<Viagem>('finalizarViagem'))
  );
}

  recusarViagem(viagemId: string): Observable<any> {
    const url = `${this.url}/${viagemId}`;
    return this.http.delete<Viagem>(url).pipe(
      catchError(this.handleError<Viagem>('recusarViagem'))
    );
  }
}
