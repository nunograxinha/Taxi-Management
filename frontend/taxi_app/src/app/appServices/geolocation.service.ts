import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private readonly addressCache = new Map<string, Promise<string>>();

  constructor() { }

  isCoordinateString(value: string | undefined | null): boolean {
    if (!value) return false;
    return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(value);
  }

  resolveDisplayAddress(rawAddress: string): Promise<string> {
    if (!rawAddress || !this.isCoordinateString(rawAddress)) {
      return Promise.resolve(rawAddress || '');
    }

    const normalized = rawAddress.trim();
    const cached = this.addressCache.get(normalized);
    if (cached) {
      return cached;
    }

    const [lat, lon] = normalized.split(',').map(part => part.trim());
    const promise = this.getAddressFromCoordinates(lat, lon).catch(() => normalized);
    this.addressCache.set(normalized, promise);
    return promise;
  }

  getCurrentPosition(): Observable<{ latitude: string, longitude: string }> {
    return from(
      new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      )
    ).pipe(
      map((position: GeolocationPosition) => ({
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString(),
      }))
    );
  }

  watchPosition(): Observable<{ latitude: string, longitude: string }> {
    return new Observable((observer) => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => observer.next({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }),
        (error) => observer.error(error)
      );

      // Cleanup: Stop watching when the observable is unsubscribed
      return () => navigator.geolocation.clearWatch(watchId);
    });
  }

  async getAddressFromCoordinates(lat: string, lon: string): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.address) {
        const cidade = data.address.city || data.address.town || data.address.village || data.address.hamlet || 'Unknown city';
        const rua = data.address.road || `${data.address.suburb}, ${data.address.city_district}` || data.address.neighborhood || 'Unknown street';
        return [cidade, rua].join(', ');
      } else {
        throw new Error('Address not found');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    }
  }

  async getCoordinatesFromAddress(city: string, street: string): Promise<{latitude: string, longitude: string}> {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(street)}, ${encodeURIComponent(city)}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const location = data[0];
          const latitude: string = location.lat;
          const longitude: string = location.lon;
          return { latitude, longitude};
        } else {
          throw new Error('Coordinates not found for address');
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error);
        throw error;
      }
  }

}
