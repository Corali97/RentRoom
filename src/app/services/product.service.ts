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
  getAll(): RentRoomProduct[] { const raw = localStorage.getItem(this.key); const items = raw ? JSON.parse(raw) : []; return items.filter((p: RentRoomProduct) => p.status === 'DISPONIBLE'); }
  save(items: RentRoomProduct[]): void { localStorage.setItem(this.key, JSON.stringify(items)); }
  create(data: any): void { const raw = localStorage.getItem(this.key); const items = raw ? JSON.parse(raw) : []; items.push({ ...data, id: Date.now(), status: 'DISPONIBLE' }); this.save(items); }
  update(product: RentRoomProduct): void { const items = this.getAll(); const i = items.findIndex(p => p.id === product.id); if (i >= 0) { items[i] = product; this.save(items); } }
  remove(id: number, ownerEmail: string): void { this.save(this.getAll().filter(p => !(p.id === id && p.ownerEmail === ownerEmail))); }
}
