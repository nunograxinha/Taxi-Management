import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Taxi } from '../taxis/taxi.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class TaxiService {

  private baseUrl = `${API_BASE_URL}/taxi`; //3073


  constructor(private http: HttpClient) {}

  getTaxis(): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(this.baseUrl);
  }

  getTaxiById(id: string): Observable<Taxi> {
    return this.http.get<Taxi>(this.baseUrl + "/id/" + id);
  }

  getTaxiByLicensePlate(plate: string): Observable<Taxi> {
    return this.http.get<Taxi>(`${this.baseUrl}/${plate}`);
  }

  createTaxi(taxi: Taxi): Observable<Taxi> {

    return this.http.post<Taxi>(this.baseUrl, taxi);
  }

  updateTaxiByLicensePlate(plate: string, updateData: Partial<Taxi>): Observable<Taxi> {
    return this.http.put<Taxi>(`${this.baseUrl}/${plate}`, updateData);
  }

  deleteTaxiByLicensePlate(plate: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${plate}`);
  }

  /* getTaxisAvailable(start: Date, end: Date): Observable<Taxi[]> {
    const params = {
      start: start.toISOString(),
      end: end.toISOString()
    };
  
    return this.http.get<Taxi[]>(`${this.baseUrl}/turno`, { params });
  }
 */  
}
