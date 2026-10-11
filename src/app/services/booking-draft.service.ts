import { Injectable } from '@angular/core';
import { SampleGarmentCode } from './reservation.service';

export interface BookingDraft {
  garmentCode: SampleGarmentCode;
  startDate: string;
  endDate: string;
}

export const SAMPLE_GARMENT_NAMES: Record<SampleGarmentCode, string> = {
  POLERA_BASICA: 'Polera básica',
  CHALECO_TEJIDO: 'Chaleco tejido',
};

const KEY = 'rentroom.bookingDraft';
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Keeps the selected garment and dates while the user signs in; the reservation is saved only after the simulated payment. */
@Injectable({ providedIn: 'root' })
export class BookingDraftService {
  save(draft: BookingDraft): void {
    try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* storage unavailable */ }
  }

  get(): BookingDraft | null {
    try {
      const value = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
      if (value && value.garmentCode in SAMPLE_GARMENT_NAMES && DATE.test(value.startDate) &&
          DATE.test(value.endDate) && value.endDate >= value.startDate) {
        return { garmentCode: value.garmentCode, startDate: value.startDate, endDate: value.endDate };
      }
    } catch { /* invalid draft */ }
    return null;
  }

  clear(): void {
    try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  }
}
