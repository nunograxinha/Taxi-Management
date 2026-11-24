import { Driver } from '../drivers/driver.interface';

export interface Trip {
  _id?: string;
  shift: string;
  numberOfPeople: number;
  distanceKm: number;
  entryTime: Date;
  exitTime: Date;
  entryAddress: string;
  exitAddress: string;
  entryAddressLabel?: string;
  exitAddressLabel?: string;
  sequenceNumber: number;
  driver: string | Driver;
  client: string | { _id?: string; name?: string };
  price: number;
  rating?: number | null;
  ratingComment?: string;
}
