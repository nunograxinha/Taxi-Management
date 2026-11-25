import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private static readonly STORAGE_KEY = 'taxi_address_cache_v1';
  private readonly addressCache = new Map<string, Promise<string>>();
  private readonly persistentCache: Record<string, string> = {};
  private reverseQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.loadPersistentCache();
  }

  private loadPersistentCache(): void {
    try {
      const raw = localStorage.getItem(GeolocationService.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          Object.assign(this.persistentCache, parsed);
        }
      }
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
  }

  private savePersistentCache(key: string, address: string): void {
    this.persistentCache[key] = address;
    try {
      localStorage.setItem(GeolocationService.STORAGE_KEY, JSON.stringify(this.persistentCache));
    } catch {
      // Ignore storage errors
    }
  }

  private buildCoordKey(rawAddress: string): string {
    const [latStr, lonStr] = rawAddress.split(',').map(part => part.trim());
    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return rawAddress.trim();
    }
    return `${lat.toFixed(5)},${lon.toFixed(5)}`;
  }

  isCoordinateString(value: string | undefined | null): boolean {
    if (!value) return false;
    return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(value);
  }

  resolveDisplayAddress(rawAddress: string): Promise<string> {
    if (!rawAddress || !this.isCoordinateString(rawAddress)) {
      return Promise.resolve(rawAddress || '');
    }

    const normalized = rawAddress.trim();
    const coordKey = this.buildCoordKey(normalized);

    if (this.persistentCache[coordKey]) {
      return Promise.resolve(this.persistentCache[coordKey]);
    }
    if (this.persistentCache[normalized]) {
      return Promise.resolve(this.persistentCache[normalized]);
    }

    const cached = this.addressCache.get(coordKey);
    if (cached) {
      return cached;
    }

    const [lat, lon] = normalized.split(',').map(part => part.trim());
    const promise = new Promise<string>((resolve) => {
      this.reverseQueue = this.reverseQueue.then(async () => {
        if (this.persistentCache[coordKey]) {
          resolve(this.persistentCache[coordKey]);
          return;
        }
        try {
          const resolved = await this.getAddressFromCoordinates(lat, lon);
          this.savePersistentCache(coordKey, resolved);
          resolve(resolved);
        } catch {
          this.addressCache.delete(coordKey);
          resolve(normalized);
        }
        await new Promise(r => setTimeout(r, 350));
      });
    });

    this.addressCache.set(coordKey, promise);
    return promise;
  }

  getCurrentPosition(): Observable<{ latitude: string, longitude: string }> {
    return from(
      new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 60000,
          timeout: 2500
        })
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status ${response.status}`);
      }
      const data = await response.json();

      if (data && data.address) {
        const cidade =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.municipality ||
          data.address.hamlet ||
          'Unknown city';
        const areaFallback = [data.address.suburb, data.address.city_district, data.address.neighborhood]
          .filter(Boolean)
          .join(', ');
        const rua = data.address.road || data.address.pedestrian || areaFallback || 'Unknown street';
        return [cidade, rua].join(', ');
      } else {
        throw new Error('Address not found');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getCoordinatesFromAddress(city: string, street: string, allowFuzzyPhoton: boolean = true): Promise<{latitude: string, longitude: string}> {
      const cleanStreet = (street || '').replace(/^[\s,]+|[\s,]+$/g, '');
      const cleanCity = (city || '').trim();
      const parts = [cleanStreet, cleanCity, 'Portugal'].filter(Boolean);
      const query = parts.join(', ');
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pt&limit=1&q=${encodeURIComponent(query)}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const location = data[0];
          return { latitude: String(location.lat), longitude: String(location.lon) };
        }

        if (allowFuzzyPhoton) {
          // Fallback to Photon (OSM) if Nominatim didn't match
          const photonQuery = [cleanStreet, cleanCity].filter(Boolean).join(' ');
          if (photonQuery) {
            const photonResp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&limit=3&lat=39.5&lon=-8.0`);
            const photonData = await photonResp.json();
            const ptHit = (photonData?.features || []).find((f: any) => !f.properties?.countrycode || f.properties.countrycode === 'PT');
            if (ptHit?.geometry?.coordinates?.length >= 2) {
              return {
                latitude: String(ptHit.geometry.coordinates[1]),
                longitude: String(ptHit.geometry.coordinates[0])
              };
            }
          }
        }

        throw new Error('Coordinates not found for address');
      } catch (error) {
        console.error('Error fetching coordinates:', error);
        throw error;
      }
  }

  async snapToNearestRoad(
    lat: number,
    lon: number,
    maxDistanceMeters: number = 500
  ): Promise<{ lat: number; lon: number; snapped: boolean }> {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { lat, lon, snapped: false };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const url = `https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}?number=1`;
      const resp = await fetch(url, { signal: controller.signal });
      if (!resp.ok) {
        return { lat, lon, snapped: false };
      }
      const data = await resp.json();
      const waypoint = data?.waypoints?.[0];
      const loc = waypoint?.location;
      const dist = typeof waypoint?.distance === 'number' ? waypoint.distance : Infinity;
      if (
        Array.isArray(loc) &&
        loc.length >= 2 &&
        Number.isFinite(Number(loc[1])) &&
        Number.isFinite(Number(loc[0])) &&
        dist <= maxDistanceMeters
      ) {
        return { lat: Number(loc[1]), lon: Number(loc[0]), snapped: true };
      }
    } catch {
      // Fallback silently to original coordinates if OSRM is unavailable
    } finally {
      clearTimeout(timeoutId);
    }

    return { lat, lon, snapped: false };
  }

}
