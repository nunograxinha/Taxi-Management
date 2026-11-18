import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { Price } from '../manage-prices/price.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  private apiUrl = `${API_BASE_URL}/price`;
  private cachedPrice$: Observable<Price> | null = null;

  constructor(private http: HttpClient) {}

  getPrice(): Observable<Price> {
    if (this.cachedPrice$) {
      return this.cachedPrice$;
    }
    this.cachedPrice$ = this.http.get<Price>(this.apiUrl).pipe(
      shareReplay(1),
      catchError(error => {
        console.error('Error fetching prices:', error);
        this.cachedPrice$ = null;
        throw error;
      })
    );

    return this.cachedPrice$;
  }

  updatePrice(id: string, price: Price): Observable<Price> {
    return this.http.put<Price>(`${this.apiUrl}/${id}`, price).pipe(
      tap((updatedPrice) => {
        this.cachedPrice$ = of(updatedPrice).pipe(shareReplay(1));
      })
    );
  }
}
