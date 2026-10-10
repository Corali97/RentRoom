import { Injectable } from '@angular/core';
import { requestApi } from './api';

export type SampleGarmentCode = 'POLERA_BASICA' | 'CHALECO_TEJIDO';

export interface SampleReservation {
  id: number;
  garmentCode: SampleGarmentCode;
  startDate: string;
  endDate: string;
  rentalDays: number;
  rentalTotal: number;
  guarantee: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  async getMine(): Promise<SampleReservation[]> {
    const result = await requestApi<{ reservations: SampleReservation[] }>('/sample-reservations');
    return result.reservations;
  }

  async create(garmentCode: SampleGarmentCode, startDate: string, endDate: string): Promise<SampleReservation> {
    const result = await requestApi<{ reservation: SampleReservation }>('/sample-reservations', 'POST', {
      garmentCode, startDate, endDate,
    });
    return result.reservation;
  }
}
