import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Cliente } from '../client/client.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${API_BASE_URL}/client`;

  constructor(private http: HttpClient) {}

  registarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/`, cliente).pipe(
      catchError(error => {
        console.error("Error registering client:", error);
        return throwError(() => new Error("Error registering client"));
      })
    );
  }

  getClients(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/`).pipe(
      catchError(error => {
        console.error("Error fetching clients:", error);
        return throwError(() => new Error("Error fetching clients"));
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
