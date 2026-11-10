import { Motorista } from "../motoristas/motorista_interface";
import { Taxi } from "../taxis/taxi_interface";

export interface Turno {
    _id?: string;
    motorista: string;
    taxi: string;
    start: string; // usar ISO strings
    end: string;
  }