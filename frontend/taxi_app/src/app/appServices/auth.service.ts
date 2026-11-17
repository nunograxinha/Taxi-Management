import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface AuthResponse {
  token: string;
  role: 'manager' | 'driver' | 'client';
  nif?: string;
  driverId?: string;
  name?: string;
  client?: {
    _id?: string;
    NIF: string;
    name: string;
    gender: 'Male' | 'Female' | 'Non-binary';
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${API_BASE_URL}/auth`;
  private readonly TOKEN_KEY = 'taxi_jwt_token';
  private readonly ROLE_KEY = 'taxi_user_role';
  private readonly DRIVER_NIF_KEY = 'taxi_driver_nif';

  constructor(private http: HttpClient) {}

  loginAsManager(password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/manager`, { password }).pipe(
      tap((res) => this.saveSession(res))
    );
  }

  loginAsDriver(nif: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/driver`, { nif, password }).pipe(
      tap((res) => this.saveSession(res))
    );
  }

  loginAsClient(nif: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/client`, { nif, password }).pipe(
      tap((res) => this.saveSession(res))
    );
  }

  registerClient(data: { NIF: string; name: string; gender: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/client/register`, data).pipe(
      tap((res) => this.saveSession(res))
    );
  }

  changeDriverPassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/driver/change-password`, {
      currentPassword,
      newPassword
    });
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.ROLE_KEY, res.role);
    if (res.nif) {
      localStorage.setItem(this.DRIVER_NIF_KEY, res.nif);
    } else {
      localStorage.removeItem(this.DRIVER_NIF_KEY);
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.DRIVER_NIF_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  getDriverNif(): string | null {
    return localStorage.getItem(this.DRIVER_NIF_KEY);
  }

  isAuthenticated(expectedRole?: string, expectedNif?: string): boolean {
    const token = this.getToken();
    const role = this.getRole();
    if (!token || !role) {
      return false;
    }

    // Check JWT expiration if payload is decodable
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(normalized));
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
          this.logout();
          return false;
        }
      }
    } catch {
      return false;
    }

    if (expectedRole && role !== expectedRole) {
      return false;
    }

    if (expectedNif && this.getDriverNif() !== expectedNif) {
      return false;
    }

    return true;
  }
}
