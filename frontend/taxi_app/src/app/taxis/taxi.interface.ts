export interface Taxi{
    _id?: string;
    licensePlate: string;
    brand: string;
    model: string;
    confort: 'Basic' | 'Luxury';
    passengerCapacity?: number;
    purchaseYear: number;
    dataCriacao? : Date;
}