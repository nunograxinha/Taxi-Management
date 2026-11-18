import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RideRequest } from '../client/ride-request.interface';
import { API_BASE_URL } from './api.config';

export interface SharedTripInfo {
  trackingRoom: string;
  entryAddress: string;
  exitAddress: string;
  confort: string;
  distanceKmToDriver?: number | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  driverName?: string | null;
  taxi?: {
    licensePlate: string;
    brand: string;
    model: string;
  } | null;
  taxiLocation?: {
    lat: number;
    lon: number;
    heading?: number;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class RideRequestService {
  private apiUrl = `${API_BASE_URL}/rideRequest`;

  constructor(private http: HttpClient) {}

  getRideRequests(): Observable<RideRequest[]> {
    return this.http.get<RideRequest[]>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  getPendingRideRequests(): Observable<RideRequest[]> {
    return this.getRideRequests().pipe(
      map(requests => requests.filter(req => !req.driverId)),
      catchError(this.handleError)
    );
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getRideRequestById(id: string): Observable<RideRequest> {
    return this.http.get<RideRequest>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createRideRequest(request: RideRequest): Observable<RideRequest> {
    return this.http.post<RideRequest>(`${this.apiUrl}`, request).pipe(
      catchError(this.handleError)
    );
  }

  deleteRideRequest(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateRideRequest(id: string, request: Partial<RideRequest>): Observable<RideRequest> {
    return this.http.patch<RideRequest>(`${this.apiUrl}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('Ride request error:', error);
    let errorMessage = 'Error communicating with server.';
    if (error.status === 500) {
      errorMessage = `Server error: ${error.message || error.statusText}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  requestDriver(requestId: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/${requestId}/requestDriver`).pipe(
      catchError(this.handleError)
    );
  }

  clientConfirm(requestId: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/${requestId}/clientConfirm`).pipe(
      catchError(this.handleError)
    );
  }

  acceptDriver(
    requestId: string,
    driverId: string,
    taxiId: string,
    distanceKmToDriver: number,
  ): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${requestId}/acceptDriver`, {
      driverId,
      taxi: taxiId,
      distanceKmToDriver,
      clientAccepted: false,
    }).pipe(
      catchError(this.handleError)
    );
  }

  acceptClient(requestId: string) {
    return this.http.patch<any>(`${this.apiUrl}/${requestId}/acceptClient`, {
      clientAccepted: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  rejectDriver(id: string, driverId?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/reject`, { driverId }).pipe(
      catchError(this.handleError)
    );
  }

  createShareLink(id: string): Observable<{ shareToken: string }> {
    return this.http.post<{ shareToken: string }>(`${this.apiUrl}/${id}/share`, {});
  }

  getSharedTrip(shareToken: string): Observable<SharedTripInfo> {
    return this.http.get<SharedTripInfo>(`${this.apiUrl}/share/${shareToken}`);
  }
}
