import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { Preco } from '../manage-prices/price.interface';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class PrecoService {
  private apiUrl = `${API_BASE_URL}/price`;
  private cachedPreco$: Observable<Preco> | null = null;


  constructor(private http: HttpClient) {}

  getPreco(): Observable<Preco> {
    if (this.cachedPreco$) {// If we have a cached response, return it
      return this.cachedPreco$;
    }
    this.cachedPreco$ = this.http.get<Preco>(this.apiUrl).pipe(
      shareReplay(1), // Share the same response with all subscribers
      catchError(error => {
        console.error('Error fetching prices:', error);
        // Reset cache on error to allow retry
        this.cachedPreco$ = null;
        throw error;
      })
    );
    
    return this.cachedPreco$;  }

    atualizarPreco(id: string, preco: Preco): Observable<Preco> {
      return this.http.put<Preco>(`${this.apiUrl}/${id}`, preco).pipe(
        tap((updatedPreco) => {
          // Clear the cache when prices are updated
          this.cachedPreco$ = null;
          
          // immediately update the cache with the new value
          this.cachedPreco$ = of(updatedPreco).pipe(shareReplay(1));
        })
      );
    }
}
