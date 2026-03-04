import { Formation } from './formation.model';

export interface Product {
  idProduct?: number;
  formation?: Formation;
  price: number;
  currency: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
