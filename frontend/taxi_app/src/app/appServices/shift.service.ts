import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Shift } from '../shifts/shift.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private readonly API_URL = `${API_BASE_URL}/shift`;

  constructor(private http: HttpClient) {}

  getShifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.API_URL}`);
  }

  getShiftsInTimeFrame(driverNIF: string, start: string, end: string): Observable<Shift[]> {
    const params = new HttpParams()
      .set('driverNIF', driverNIF)
      .set('start', start)
      .set('end', end);

    return this.http.get<Shift[]>(`${this.API_URL}/interval`, { params });
  }

  createShift(shift: Shift): Observable<Shift> {
    return this.http.post<Shift>(`${this.API_URL}`, shift);
  }

  getShiftById(id: string): Observable<Shift> {
    return this.http.get<Shift>(`${this.API_URL}/${id}`);
  }

  deleteShift(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  updateShift(id: string, shift: Partial<Shift>): Observable<Shift> {
    return this.http.put<Shift>(`${this.API_URL}/${id}`, shift);
  }

  getShiftsByDriverNIF(driverNIF: string): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.API_URL}/driver/${driverNIF}`);
  }

  getShiftsByTaxiPlate(plate: string): Observable<Shift[]> {
    return this.http.get<Shift[]>(`${this.API_URL}/taxi/${plate}`);
  }
}
