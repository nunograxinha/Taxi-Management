import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

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
  private activeToken: string | null = null;
  private activeShareToken: string | null = null;

  constructor(private authService: AuthService, private ngZone: NgZone) {
    this.socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false
    });

    this.socket.on('connect', () => {
      if (this.activeToken) {
        this.joinedPedidos.forEach((id) => {
          this.socket.emit('joinPedido', id);
        });
      }
    });

    this.authService.token$.subscribe((token) => {
      this.activeToken = token;
      if (token) {
        this.socket.auth = { token };
        if (this.socket.connected) {
          this.socket.disconnect();
        }
        this.socket.connect();
      } else {
        this.joinedPedidos.clear();
        if (this.activeShareToken) {
          this.socket.auth = { shareToken: this.activeShareToken };
          if (this.socket.connected) {
            this.socket.disconnect();
          }
          this.socket.connect();
        } else {
          this.socket.auth = {};
          this.socket.disconnect();
        }
      }
    });
  }

  joinSharedTrip(shareToken: string, trackingRoom?: string): void {
    if (!shareToken) return;
    this.activeShareToken = shareToken;
    if (this.activeToken) {
      if (trackingRoom) {
        this.joinPedido(trackingRoom);
      }
      return;
    }
    this.socket.auth = { shareToken };
    if (this.socket.connected) {
      this.socket.disconnect();
    }
    this.socket.connect();
  }

  leaveSharedTrip(trackingRoom?: string): void {
    this.activeShareToken = null;
    if (this.activeToken) {
      if (trackingRoom) {
        this.leavePedido(trackingRoom);
      }
      return;
    }
    this.socket.auth = {};
    this.socket.disconnect();
  }

  joinPedido(pedidoId: string): void {
    if (pedidoId) {
      this.joinedPedidos.add(pedidoId);
      if (this.socket.connected && this.activeToken) {
        this.socket.emit('joinPedido', pedidoId);
      }
    }
  }

  leavePedido(pedidoId: string): void {
    if (pedidoId) {
      this.joinedPedidos.delete(pedidoId);
      if (this.socket.connected) {
        this.socket.emit('leavePedido', pedidoId);
      }
    }
  }

  emitDriverLocation(payload: { pedidoId: string; lat: number; lon: number; heading?: number | null }): void {
    if (payload?.pedidoId && this.activeToken) {
      this.socket.emit('driverLocation', payload);
    }
  }

  sendChatMessage(payload: {
    pedidoId: string;
    senderRole: 'client' | 'driver';
    senderName: string;
    text: string;
  }): void {
    if (payload?.pedidoId && payload?.text?.trim() && this.activeToken) {
      this.socket.emit('chat:send', payload);
    }
  }

  requestChatHistory(pedidoId: string): void {
    if (pedidoId && this.socket.connected && this.activeToken) {
      this.socket.emit('chat:getHistory', pedidoId);
    }
  }

  requestFleetLocations(): void {
    if (this.socket.connected && this.activeToken) {
      this.socket.emit('fleet:getLocations');
    }
  }

  onEvent<T>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      const handler = (data: T) => this.ngZone.run(() => observer.next(data));
      this.socket.on(eventName, handler);
      return () => {
        this.socket.off(eventName, handler);
      };
    });
  }
}
