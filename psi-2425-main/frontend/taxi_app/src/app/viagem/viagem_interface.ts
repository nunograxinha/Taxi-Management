import { Motorista } from "../motoristas/motorista_interface";

export interface Viagem {
    _id?: string;
    turno: string;
    numberOfPeople: number;
    distanceKm: number;
    entryTime: Date;
    exitTime: Date;
    entryAddress: string;
    exitAddress: string;
    sequenceNumber: number;
    motorista: string | Motorista;
    cliente: string;
    preco: number;
}
