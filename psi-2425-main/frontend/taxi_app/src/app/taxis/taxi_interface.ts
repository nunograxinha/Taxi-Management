export interface Taxi{
    _id?: string;
    licensePlate: string;
    brand: string;
    model: string;
    confort: 'Basico' | 'Luxuoso';
    purchaseYear: number;
    dataCriacao? : Date;
}