import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PedidoViagem } from '../cliente/pedidoViagem_interface';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoViagemService {
  private apiUrl = 'http://localhost:3073/rideRequest';

  constructor(private http: HttpClient) { }

  getPedidos(): Observable<PedidoViagem[]> {
    return this.http.get<PedidoViagem[]>(`${this.apiUrl}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getPedidosPendentes(): Observable<PedidoViagem[]> {
    return this.getPedidos().pipe(
      // Filter out ride requests that already have a driver assigned
      map(pedidos => pedidos.filter(pedido => !pedido.driverId)),
      catchError(this.handleError)
    );
  }

  // Calculate distance in km between two coordinates using Haversine formula
  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  getPedidoById(id: string): Observable<PedidoViagem> {
    return this.http.get<PedidoViagem>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createPedido(pedido: PedidoViagem): Observable<PedidoViagem> {
    return this.http.post<PedidoViagem>(`${this.apiUrl}`, pedido)
      .pipe(
        catchError(this.handleError)
      );
  }

  deletePedido(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updatePedido(id: string, pedido: Partial<PedidoViagem>): Observable<PedidoViagem> {
    return this.http.patch<PedidoViagem>(`${this.apiUrl}/${id}`, pedido)
      .pipe(
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

  requestMotorista(idPedido: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/${idPedido}/requestDriver`)
      .pipe(
        catchError(this.handleError)
      );
  }

  clientConfirm(idPedido: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/${idPedido}/clientConfirm`)
      .pipe(
        catchError(this.handleError)
      );
  }

  acceptMotorista(
    idPedido: string,
    driverId: string,
    taxiId: string,
    distanceKmToDriver: number,
  ): Observable<any> {    
    return this.http.patch<any>(`${this.apiUrl}/${idPedido}/acceptDriver`, {
      driverId,
      taxi: taxiId,
      distanceKmToDriver,
      clientAccepted: false,
    }).pipe(
      catchError(this.handleError)
    );
  }

  acceptClient(idPedido: string) {
    return this.http.patch<any>(`${this.apiUrl}/${idPedido}/acceptClient`, { 
      clientAccepted: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  rejectMotorista(id: string, driverId?: string): Observable<any> {
  return this.http.patch<any>(`${this.apiUrl}/${id}/reject`, { driverId })
    .pipe(
      catchError(this.handleError)
    );
}
}