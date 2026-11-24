import { Person } from '../models/person.interface';

export interface FavoritePlace {
  _id?: string;
  label: string;
  icon: 'home' | 'work' | 'star' | 'place';
  address: string;
  coords: string;
}

export interface Client extends Person {
  favoritePlaces?: FavoritePlace[];
}
