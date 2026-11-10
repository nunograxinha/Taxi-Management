import { Cliente } from "./cliente_interface";

export interface PedidoViagem {
    _id?: string;
    cliente: string | Cliente; // guarda id do Cliente
    numberOfPeople: number;
    distanceKmToMotorista?: number;
    entryAddress: string;
    exitAddress: string;
    confort: 'Basico' | 'Luxuoso';
    motoristaId?: string;
    taxi?: string;
    clienteAceitou?: boolean;
    startTime?: Date;
    endTime?: Date;
    price?: number;
    rejeitados?: string[]; // IDs dos motoristas em que os clientes rejeitaram o pedido
  }
