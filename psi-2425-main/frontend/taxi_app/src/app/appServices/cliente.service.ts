import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Cliente } from '../cliente/cliente_interface';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:3073/cliente'; //3073

  constructor(private http: HttpClient) {}

  registarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/`, cliente).pipe(
      catchError(error => {
        console.error("Erro ao registar cliente:", error);
        return throwError(() => new Error("Erro ao registar cliente"));
      })
    );
  }

  getClient(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error("Erro ao obter cliente:", error);
        return throwError(() => new Error("Erro ao obter cliente"));
      })
    );
  }
}
