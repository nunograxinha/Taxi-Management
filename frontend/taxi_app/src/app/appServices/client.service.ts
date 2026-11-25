import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Client, FavoritePlace } from '../client/client.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${API_BASE_URL}/client`;

  constructor(private http: HttpClient) {}

  registerClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/`, client).pipe(
      catchError(error => {
        console.error('Error registering client:', error);
        return throwError(() => new Error('Error registering client'));
      })
    );
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/`).pipe(
      catchError(error => {
        console.error('Error fetching clients:', error);
        return throwError(() => new Error('Error fetching clients'));
      })
    );
  }

  getClient(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching client:', error);
        return throwError(() => new Error('Error fetching client'));
      })
    );
  }

  getFavoritePlaces(clientId: string): Observable<{ favoritePlaces: FavoritePlace[] }> {
    return this.http.get<{ favoritePlaces: FavoritePlace[] }>(`${this.apiUrl}/${clientId}/favorites`);
  }

  updateFavoritePlaces(
    clientId: string,
    favoritePlaces: FavoritePlace[]
  ): Observable<{ favoritePlaces: FavoritePlace[] }> {
    return this.http.put<{ favoritePlaces: FavoritePlace[] }>(
      `${this.apiUrl}/${clientId}/favorites`,
      { favoritePlaces }
    );
  }

  updateClientPhoto(clientId: string, profilePhoto: string | null): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${clientId}/photo`, { profilePhoto });
  }
}
