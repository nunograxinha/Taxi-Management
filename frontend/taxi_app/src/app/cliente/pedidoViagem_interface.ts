import { Cliente } from "./cliente_interface";

export interface PedidoViagem {
    _id?: string;
    cliente: string | Cliente; // stores Client ID
    numberOfPeople: number;
    distanceKmToMotorista?: number;
    entryAddress: string;
    exitAddress: string;
    confort: 'Basic' | 'Luxury';
    motoristaId?: string;
    taxi?: string;
    clienteAceitou?: boolean;
    startTime?: Date;
    endTime?: Date;
    price?: number;
    rejeitados?: string[]; // IDs of drivers rejected by the client
  }
