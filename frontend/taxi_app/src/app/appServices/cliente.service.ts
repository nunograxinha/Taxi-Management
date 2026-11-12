import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Cliente } from '../cliente/cliente_interface';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:3073/client';

  constructor(private http: HttpClient) {}

  registarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/`, cliente).pipe(
      catchError(error => {
        console.error("Error registering client:", error);
        return throwError(() => new Error("Error registering client"));
      })
    );
  }

  getClient(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error("Error fetching client:", error);
        return throwError(() => new Error("Error fetching client"));
      })
    );
  }
}
