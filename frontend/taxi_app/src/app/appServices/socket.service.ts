import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  pedidoId: string;
  senderRole: 'client' | 'driver';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface FleetDriverLocation {
  pedidoId: string;
  lat: number;
  lon: number;
  heading?: number;
  updatedAt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private joinedPedidos = new Set<string>();

  constructor() {
    this.socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    this.socket.on('connect', () => {
      this.joinedPedidos.forEach((id) => {
        this.socket.emit('joinPedido', id);
      });
    });
  }

  joinPedido(pedidoId: string): void {
    if (pedidoId) {
      this.joinedPedidos.add(pedidoId);
      this.socket.emit('joinPedido', pedidoId);
    }
  }

  leavePedido(pedidoId: string): void {
    if (pedidoId) {
      this.joinedPedidos.delete(pedidoId);
      this.socket.emit('leavePedido', pedidoId);
    }
  }

  emitDriverLocation(payload: { pedidoId: string; lat: number; lon: number; heading?: number | null }): void {
    if (payload?.pedidoId) {
      this.socket.emit('driverLocation', payload);
    }
  }

  sendChatMessage(payload: {
    pedidoId: string;
    senderRole: 'client' | 'driver';
    senderName: string;
    text: string;
  }): void {
    if (payload?.pedidoId && payload?.text?.trim()) {
      this.socket.emit('chat:send', payload);
    }
  }

  requestChatHistory(pedidoId: string): void {
    if (pedidoId) {
      this.socket.emit('chat:getHistory', pedidoId);
    }
  }

  requestFleetLocations(): void {
    this.socket.emit('fleet:getLocations');
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
