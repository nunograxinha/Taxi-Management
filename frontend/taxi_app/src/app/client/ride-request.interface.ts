import { Client } from './client.interface';

export interface RideRequest {
  _id?: string;
  client: string | Client;
  numberOfPeople: number;
  distanceKmToDriver?: number;
  entryAddress: string;
  exitAddress: string;
  entryAddressLabel?: string;
  exitAddressLabel?: string;
  confort: 'Basic' | 'Luxury';
  driverId?: string;
  taxi?: string;
  clientAccepted?: boolean;
  startTime?: Date;
  endTime?: Date;
  price?: number;
  rating?: number | null;
  ratingComment?: string;
  rejectedDrivers?: string[];
}
