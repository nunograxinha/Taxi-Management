import { Cliente } from "./cliente_interface";

export interface PedidoViagem {
    _id?: string;
    client: string | Cliente; // stores Client ID
    numberOfPeople: number;
    distanceKmToDriver?: number;
    entryAddress: string;
    exitAddress: string;
    confort: 'Basic' | 'Luxury';
    driverId?: string;
    taxi?: string;
    clientAccepted?: boolean;
    startTime?: Date;
    endTime?: Date;
    price?: number;
    rejectedDrivers?: string[]; // IDs of drivers rejected by the client
  }
