import { Motorista } from "../drivers/driver.interface";

export interface Viagem {
    _id?: string;
    shift: string;
    numberOfPeople: number;
    distanceKm: number;
    entryTime: Date;
    exitTime: Date;
    entryAddress: string;
    exitAddress: string;
    sequenceNumber: number;
    driver: string | Motorista;
    client: string;
    price: number;
}
