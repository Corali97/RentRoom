import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, RentRoomUser } from '../services/auth.service';
import { SAMPLE_GARMENT_NAMES } from '../services/booking-draft.service';
import { ReservationService, SampleReservation } from '../services/reservation.service';
import { ApiError, errorMessage } from '../services/api';

export interface GarmentSummary {
  name: string;
  reservations: number;
  days: number;
  total: number;
}

@Component({ selector: 'app-reportes', templateUrl: './reportes.page.html', styleUrls: ['./reportes.page.scss'], standalone: false })
export class ReportesPage {
  user: RentRoomUser | null = null;
  reservations: SampleReservation[] = [];
  fromDate = '';
  toDate = '';
  generatedAt = '';
  message = '';
  loading = true;

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.loading = true;
    this.message = '';
    try {
      this.user = await this.authService.refreshSession();
      if (!this.user) { await this.router.navigateByUrl('/usuario'); return; }
      if (this.user.role !== 'CLIENTE') {
        this.message = 'Los reportes de reservas están disponibles para cuentas Cliente.';
      } else {
        this.reservations = await this.reservationService.getMine();
        this.generatedAt = new Date().toLocaleString('es-CL');
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { await this.router.navigateByUrl('/usuario'); return; }
      this.message = errorMessage(error);
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  get filtered(): SampleReservation[] {
    return this.reservations.filter(item =>
      (!this.fromDate || item.endDate >= this.fromDate) && (!this.toDate || item.startDate <= this.toDate));
  }

  get totalDays(): number { return this.filtered.reduce((sum, item) => sum + item.rentalDays, 0); }
  get totalRental(): number { return this.filtered.reduce((sum, item) => sum + item.rentalTotal, 0); }
  get totalGuarantee(): number { return this.filtered.reduce((sum, item) => sum + item.guarantee, 0); }
  get grandTotal(): number { return this.totalRental + this.totalGuarantee; }

  get summary(): GarmentSummary[] {
    const groups = new Map<string, GarmentSummary>();
    for (const item of this.filtered) {
      const name = this.garmentName(item);
      const group = groups.get(name) ?? { name, reservations: 0, days: 0, total: 0 };
      group.reservations += 1;
      group.days += item.rentalDays;
      group.total += item.total;
      groups.set(name, group);
    }
    return [...groups.values()];
  }

  garmentName(item: SampleReservation): string { return SAMPLE_GARMENT_NAMES[item.garmentCode] ?? item.garmentCode; }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  }

  clearFilters(): void { this.fromDate = this.toDate = ''; }

  print(): void { window.print(); }

  csvContent(): string {
    const header = ['Reserva', 'Prenda', 'Inicio', 'Término', 'Días', 'Arriendo', 'Garantía', 'Total'];
    const rows = this.filtered.map(item => [item.id, this.garmentName(item), item.startDate, item.endDate,
      item.rentalDays, item.rentalTotal, item.guarantee, item.total]);
    return [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  }

  downloadCsv(): void {
    const blob = new Blob(['\ufeff' + this.csvContent()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-reservas-rentroom.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
