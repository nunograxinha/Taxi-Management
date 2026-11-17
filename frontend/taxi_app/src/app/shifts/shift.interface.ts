import { Motorista } from "../drivers/driver.interface";
import { Taxi } from "../taxis/taxi.interface";

export interface Turno {
    _id?: string;
    driver: string;
    taxi: string;
    start: string; // ISO string
    end: string;
  }