import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Driver } from '../drivers/driver.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = `${API_BASE_URL}/driver`;

  private driverSubject = new BehaviorSubject<Driver | null>(null);
  driver$ = this.driverSubject.asObservable();

  setDriver(driver: Driver) {
    this.driverSubject.next(driver);
  }

  getDriver(): Driver | null {
    return this.driverSubject.getValue();
  }

  constructor(private http: HttpClient) {}

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(this.apiUrl);
  }

  createDriver(driver: Driver): Observable<Driver> {
    return this.http.post<Driver>(this.apiUrl, driver);
  }

  deleteDriverByNIF(nif: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${nif}`);
  }

  getDriverByNIF(nif: string): Observable<Driver> {
    return this.http.get<Driver>(`${this.apiUrl}/${nif}`);
  }

  getDriverById(id: string): Observable<Driver> {
    return this.http.get<Driver>(`${this.apiUrl}/id/${id}`);
  }

  updateDriver(nif: string, updateData: Partial<Driver>): Observable<Driver> {
    return this.http.put<Driver>(`${this.apiUrl}/${nif}`, updateData);
  }

  updateDriverPhoto(nif: string, profilePhoto: string | null): Observable<Driver> {
    return this.http.put<Driver>(`${this.apiUrl}/${nif}/photo`, { profilePhoto });
  }

  sortDriversByUpdatedAt(drivers: Driver[]): Driver[] {
    return [...drivers].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  }
}
