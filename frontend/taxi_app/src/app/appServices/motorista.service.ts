import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Motorista } from '../motoristas/motorista_interface';

@Injectable({
  providedIn: 'root'
})
export class MotoristaService {
  private apiUrl = 'http://localhost:3073/driver';
  
  private motoristaSubject = new BehaviorSubject<Motorista| null>(null);

  motorista$ = this.motoristaSubject.asObservable();

  setMotorista(motorista: Motorista) {
    this.motoristaSubject.next(motorista);
  }

  getMotorista(): Motorista | null {
    return this.motoristaSubject.getValue();
  }

  constructor(private http: HttpClient) {}

  // Get all drivers
  obterMotoristas(): Observable<Motorista[]> {
    return this.http.get<Motorista[]>(this.apiUrl);
  }

  // Create a new driver
  criarMotorista(motorista: Motorista): Observable<Motorista> {
    return this.http.post<Motorista>(this.apiUrl, motorista);
  }

  // Delete driver by NIF
  apagarMotoristaPorNIF(nif: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${nif}`);
  }

  // Get a driver by NIF
  obterMotorista(nif: string): Observable<Motorista> {
    return this.http.get<Motorista>(`${this.apiUrl}/${nif}`);
  }

  // Update driver by NIF
  atualizarMotorista(nif: string, updateData: Partial<Motorista>): Observable<Motorista> {
    return this.http.put<Motorista>(`${this.apiUrl}/${nif}`, updateData);
  }

  // Get a driver by NIF
  getMotoristaPorNIF(nif: string): Observable<Motorista> {
    return this.http.get<Motorista>(`${this.apiUrl}/${nif}`);
  }

  getMotoristaPorId(id: string): Observable<Motorista> {
    return this.http.get<Motorista>(`${this.apiUrl}/id/${id}`);
  }

  // Sort drivers by updatedAt date
  sortMotoristasByUpdatedAt(motoristas: Motorista[]): Motorista[] {
    return [...motoristas].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  }
}
