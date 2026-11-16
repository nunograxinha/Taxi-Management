import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly serverUrl = 'http://localhost:3073';

  constructor() {
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling']
    });
  }

  joinPedido(pedidoId: string): void {
    if (pedidoId) {
      this.socket.emit('joinPedido', pedidoId);
    }
  }

  leavePedido(pedidoId: string): void {
    if (pedidoId) {
      this.socket.emit('leavePedido', pedidoId);
    }
  }

  emitDriverLocation(payload: { pedidoId: string; lat: number; lon: number; heading?: number | null }): void {
    if (payload?.pedidoId) {
      this.socket.emit('driverLocation', payload);
    }
  }

  onEvent<T>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      const handler = (data: T) => observer.next(data);
      this.socket.on(eventName, handler);
      return () => {
        this.socket.off(eventName, handler);
      };
    });
  }
}
