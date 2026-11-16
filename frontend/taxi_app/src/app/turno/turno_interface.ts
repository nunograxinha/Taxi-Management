import { Motorista } from "../motoristas/motorista_interface";
import { Taxi } from "../taxis/taxi_interface";

export interface Turno {
    _id?: string;
    driver: string;
    taxi: string;
    start: string; // ISO string
    end: string;
  }