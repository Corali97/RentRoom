import { Injectable } from '@angular/core';
import { requestApi } from './api';

export interface RentRoomProduct {
  id: number;
  ownerEmail: string;
  name: string;
  description: string;
  category: string;
  purchaseValue: number | null;
  rentalValue: number;
  guarantee: number;
  imageUrl: string;
  status: 'DISPONIBLE' | 'INACTIVO';
}

export type ProductForm = Omit<RentRoomProduct, 'id' | 'ownerEmail' | 'status'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
  async getAll(): Promise<RentRoomProduct[]> {
    const result = await requestApi<{ products: RentRoomProduct[] }>('/products');
    return result.products.filter(product => product.status === 'DISPONIBLE');
  }

  async create(data: ProductForm): Promise<RentRoomProduct> {
    const result = await requestApi<{ product: RentRoomProduct }>('/products', 'POST', this.fields(data));
    return result.product;
  }

  async update(product: RentRoomProduct): Promise<RentRoomProduct> {
    const result = await requestApi<{ product: RentRoomProduct }>(`/products/${product.id}`, 'PUT', {
      ...this.fields(product), status: product.status,
    });
    return result.product;
  }

  async remove(id: number): Promise<void> {
    await requestApi<{ message: string }>(`/products/${id}`, 'DELETE');
  }

  private fields(data: ProductForm): ProductForm {
    const { name, description, category, purchaseValue, rentalValue, guarantee, imageUrl } = data;
    return { name, description, category, purchaseValue, rentalValue, guarantee, imageUrl };
  }
}
