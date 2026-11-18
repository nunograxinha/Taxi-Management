import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { Trip } from '../trips/trip.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private url = `${API_BASE_URL}/trip`;

  constructor(private http: HttpClient) {}

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  getAllTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.url}/`).pipe(
      catchError(this.handleError<Trip[]>('getAllTrips', []))
    );
  }

  createTrip(trip: any): Observable<Trip> {
    return this.http.post<Trip>(this.url, trip).pipe(
      catchError(this.handleError<Trip>('createTrip'))
    );
  }

  getTripsByDriver(driverId: string): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.url}/driver/${driverId}`).pipe(
      catchError(this.handleError<Trip[]>('getTripsByDriver', []))
    );
  }

  getTripById(tripId: string): Observable<Trip | null> {
    return this.http.get<Trip>(`${this.url}/${tripId}`).pipe(
      catchError(this.handleError<Trip>('getTripById', null!))
    );
  }

  acceptRideRequest(tripId: string, driverId: string): Observable<Trip> {
    return this.http.put<Trip>(`${this.url}/${tripId}`, { driver: driverId }).pipe(
      catchError(this.handleError<Trip>('acceptRideRequest'))
    );
  }

  startTrip(tripId: string): Observable<Trip> {
    return this.http.put<Trip>(`${this.url}/${tripId}`, { entryTime: new Date() }).pipe(
      catchError(this.handleError<Trip>('startTrip'))
    );
  }

  finishTrip(tripId: string): Observable<Trip> {
    return this.http.put<Trip>(`${this.url}/${tripId}`, { exitTime: new Date() }).pipe(
      catchError(this.handleError<Trip>('finishTrip'))
    );
  }

  rejectTrip(tripId: string): Observable<any> {
    return this.http.delete<Trip>(`${this.url}/${tripId}`).pipe(
      catchError(this.handleError<Trip>('rejectTrip'))
    );
  }
}
