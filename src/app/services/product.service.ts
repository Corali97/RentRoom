import { Injectable } from '@angular/core';

export interface RentRoomProduct {
  id: number;
  ownerEmail: string;
  name: string;
  description: string;
  category: string;
  purchaseValue: number;
  rentalValue: number;
  guarantee: number;
  imageUrl: string;
  status: 'DISPONIBLE' | 'INACTIVO';
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly key = 'rentroom_products';
  private getStoredProducts(): RentRoomProduct[] {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : [];
  }
  getAll(): RentRoomProduct[] { return this.getStoredProducts().filter(p => p.status === 'DISPONIBLE'); }
  save(items: RentRoomProduct[]): void { localStorage.setItem(this.key, JSON.stringify(items)); }
  create(data: any): void { const items = this.getStoredProducts(); items.push({ ...data, id: Date.now(), status: 'DISPONIBLE' }); this.save(items); }
  update(product: RentRoomProduct): void { const items = this.getStoredProducts(); const i = items.findIndex(p => p.id === product.id); if (i >= 0) { items[i] = product; this.save(items); } }
  remove(id: number, ownerEmail: string): void { this.save(this.getStoredProducts().filter(p => !(p.id === id && p.ownerEmail === ownerEmail))); }
}
