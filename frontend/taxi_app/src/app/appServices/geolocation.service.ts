import { Injectable } from '@angular/core';
import { position } from 'carbon-components-angular';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

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
        const cidade = data.address.city || data.address.town || data.address.village || data.address.hamlet || 'Cidade desconhecida';
        const rua = data.address.road || `${data.address.suburb}, ${data.address.city_district}` || data.address.neighborhood || 'Rua desconhecida';
        return [cidade, rua].join(', ');
      } else {
        throw new Error('Endereço não encontrado');
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
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
          throw new Error('Coordenadas não encontradas para o endereço');
        }
      } catch (error) {
        console.error('Erro ao obter coordenadas:', error);
        throw error;
      }
  }

}
