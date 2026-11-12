export interface Taxi{
    _id?: string;
    licensePlate: string;
    brand: string;
    model: string;
    confort: 'Basic' | 'Luxury';
    purchaseYear: number;
    dataCriacao? : Date;
}