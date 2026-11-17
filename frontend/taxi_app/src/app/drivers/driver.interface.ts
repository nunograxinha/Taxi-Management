import { Pessoa } from "../models/person.interface";

export interface Motorista extends Pessoa{
    birthYear: number;
    drivingLicenseNumber: string;
    address: {
        postalCode: string;
        city: string;
        street: string;
        doorNumber: string;
    }
    createdAt? : Date;
    updatedAt? : Date;
}