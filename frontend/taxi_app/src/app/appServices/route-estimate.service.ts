import { Injectable } from '@angular/core';
import { Price } from '../manage-prices/price.interface';

export interface RouteEstimate {
  distanceKm: number;
  durationMin: number;
  fromOsrm: boolean;
}

export interface FareEstimate {
  total: number;
  hasNight: boolean;
  nightMinutes: number;
}

const DEFAULT_FALLBACK_ROAD_FACTOR = 1.3;
const DEFAULT_URBAN_SPEED_KMH = 35;

@Injectable({
  providedIn: 'root'
})
export class RouteEstimateService {
  private routeCache = new Map<string, Promise<RouteEstimate>>();

  parseCoords(raw: string | undefined | null): [number, number] | null {
    if (!raw || typeof raw !== 'string' || !raw.includes(',')) return null;
    const parts = raw.split(',').map((s) => s.trim());
    if (parts.length !== 2) return null;
    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
  }

  haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  estimateFallback(
    from: [number, number],
    to: [number, number],
    options?: { allowZero?: boolean }
  ): RouteEstimate {
    const directKm = this.haversineKm(from[0], from[1], to[0], to[1]);
    if (options?.allowZero && directKm < 0.05) {
      return { distanceKm: 0, durationMin: 0, fromOsrm: false };
    }
    const roadKm = Number((directKm * DEFAULT_FALLBACK_ROAD_FACTOR).toFixed(2));
    const durationMin = Math.max(1, Math.round((roadKm / DEFAULT_URBAN_SPEED_KMH) * 60));
    return { distanceKm: roadKm, durationMin, fromOsrm: false };
  }

  estimateArrivalMinutesFromRoadKm(roadKm: number | null | undefined): number {
    if (typeof roadKm !== 'number' || !Number.isFinite(roadKm) || roadKm < 0.05) {
      return 0;
    }
    return Math.max(1, Math.round((roadKm / DEFAULT_URBAN_SPEED_KMH) * 60));
  }

  getRouteEstimate(
    from: [number, number],
    to: [number, number],
    options?: { allowZero?: boolean }
  ): Promise<RouteEstimate> {
    const directKm = this.haversineKm(from[0], from[1], to[0], to[1]);
    if (options?.allowZero && directKm < 0.05) {
      return Promise.resolve({ distanceKm: 0, durationMin: 0, fromOsrm: true });
    }

    const cacheKey = `${from[0].toFixed(5)},${from[1].toFixed(5)}|${to[0].toFixed(5)},${to[1].toFixed(5)}|${options?.allowZero ? '1' : '0'}`;
    const existing = this.routeCache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const promise = (async (): Promise<RouteEstimate> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false`;
        const resp = await fetch(osrmUrl, { signal: controller.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const route = data?.routes?.[0];
        if (typeof route?.distance === 'number' && typeof route?.duration === 'number') {
          const distanceKm = Number((route.distance / 1000).toFixed(2));
          const durationMin =
            options?.allowZero && route.distance < 50
              ? 0
              : Math.max(1, Math.round(route.duration / 60));
          return { distanceKm, durationMin, fromOsrm: true };
        }
        throw new Error('Invalid OSRM response');
      } catch {
        this.routeCache.delete(cacheKey);
        return this.estimateFallback(from, to, options);
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    this.routeCache.set(cacheKey, promise);
    return promise;
  }

  computeEstimatedFare(
    price: Price,
    confort: 'Basic' | 'Luxury',
    durationMin: number,
    startTime: Date = new Date()
  ): FareEstimate {
    const rate =
      confort === 'Luxury'
        ? price.pricePerMinuteLuxury
        : price.pricePerMinuteConfort;
    const surcharge = price.nightTimeSurcharge || 0;
    const current = new Date(startTime);
    let nightMinutes = 0;

    for (let i = 0; i < durationMin; i++) {
      const hour = current.getHours();
      if (hour >= 21 || hour < 6) {
        nightMinutes++;
      }
      current.setMinutes(current.getMinutes() + 1);
    }

    const dayMinutes = Math.max(0, durationMin - nightMinutes);
    const dayPrice = rate * dayMinutes;
    const nightPrice = nightMinutes * (rate * (1 + surcharge / 100));

    return {
      total: Math.round((dayPrice + nightPrice) * 100) / 100,
      hasNight: nightMinutes > 0 && surcharge > 0,
      nightMinutes
    };
  }
}
