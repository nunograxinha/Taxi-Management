import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Turno } from '../turno/turno_interface';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private readonly API_URL = 'http://localhost:3073/turno';

  constructor(private http: HttpClient) {}

  getTurnos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.API_URL}`);
  }

  //a testar
  getTurnosInTimeFrame(motoristaNIF: string, start: string, end: string): Observable<Turno[]> {
    const params = new HttpParams()
      .set('motoristaNIF', motoristaNIF)
      .set('start', start)
      .set('end', end);
  
    return this.http.get<Turno[]>(`${this.API_URL}/intervalo`, { params });
  }
  

  createTurno(turno: Turno): Observable<Turno> {
    return this.http.post<Turno>(`${this.API_URL}`, turno);
  }

  getTurnoById(id: string): Observable<Turno> {
    return this.http.get<Turno>(`${this.API_URL}/${id}`);
  }

  deleteTurno(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  updateTurno(id: string, turno: Partial<Turno>): Observable<Turno> {
    return this.http.put<Turno>(`${this.API_URL}/${id}`, turno);
  }

  getTurnosByMotoristaNIF(motoristaNIF: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.API_URL}/motorista/${motoristaNIF}`);
  }

  getTurnosByTaxiPlate(plate: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.API_URL}/taxi/${plate}`);
  }
}

