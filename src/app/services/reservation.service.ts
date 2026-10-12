import { Injectable } from '@angular/core';
import { requestApi } from './api';

export interface RentRoomReservation {
  id: number; productId: number; productName: string;
  startDate: string; endDate: string;
  status: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';
}
export interface ReservedPeriod { startDate: string; endDate: string; }
export interface RentalEvent { action: string; detail: string | null; date: string; }

@Injectable({ providedIn: 'root' })
export class ReservationService {
  async list(): Promise<RentRoomReservation[]> {
    return (await requestApi<{reservations: RentRoomReservation[]}>('/reservations')).reservations;
  }
  async ownerList(): Promise<RentRoomReservation[]> {
    return (await requestApi<{reservations: RentRoomReservation[]}>('/owner/reservations')).reservations;
  }
  async occupied(id: number): Promise<ReservedPeriod[]> {
    return (await requestApi<{occupied: ReservedPeriod[]}>('/products/' + id + '/availability')).occupied;
  }
  async create(productId: number, startDate: string, endDate: string): Promise<void> {
    await requestApi('/reservations', 'POST', {productId,startDate,endDate});
  }
  async cancel(id: number): Promise<void> {
    await requestApi('/reservations/' + id + '/cancel', 'POST', {});
  }
  async confirm(id: number): Promise<void> {
    await requestApi('/owner/reservations/' + id + '/confirm', 'POST', {});
  }
  async track(id: number,action: 'ENTREGAR'|'DEVOLVER'|'DANO'|'LIBERAR_GARANTIA'|'RETENER_GARANTIA',detail = ''): Promise<void> {
    await requestApi('/owner/reservations/' + id + '/tracking','POST',{action,detail});
  }
  async history(id: number): Promise<{events: RentalEvent[];guaranteeStatus: string;damageNotes: string}> {
    return requestApi('/reservations/' + id + '/history');
  }
}
