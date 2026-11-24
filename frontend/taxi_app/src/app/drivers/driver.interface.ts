import { Person } from '../models/person.interface';

export interface Driver extends Person {
  birthYear: number;
  drivingLicenseNumber: string;
  address: {
    postalCode: string;
    city: string;
    street: string;
    doorNumber: string;
  };
  ratingAverage?: number;
  ratingCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
