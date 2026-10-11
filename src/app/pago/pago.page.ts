import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, RentRoomUser } from '../services/auth.service';
import { BookingDraft, BookingDraftService, SAMPLE_GARMENT_NAMES } from '../services/booking-draft.service';
import { ReservationService, SampleReservation } from '../services/reservation.service';
import { ApiError, errorMessage } from '../services/api';

@Component({ selector: 'app-pago', templateUrl: './pago.page.html', styleUrls: ['./pago.page.scss'], standalone: false })
export class PagoPage {
  readonly rentalPricePerDay = 10000;
  readonly guaranteeAmount = 20000;
  draft: BookingDraft | null = null;
  user: RentRoomUser | null = null;
  reservation: SampleReservation | null = null;
  cardName = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  message = '';
  messageType: 'success' | 'error' = 'error';
  canRetryCatalogue = false;
  loading = true;
  busy = false;

  constructor(
    private authService: AuthService,
    private drafts: BookingDraftService,
    private reservationService: ReservationService,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.loading = true;
    this.message = '';
    this.reservation = null;
    this.canRetryCatalogue = false;
    this.draft = this.drafts.get();
    try {
      this.user = await this.authService.refreshSession();
    } catch (error) {
      this.user = null;
      this.showMessage(errorMessage(error), 'error');
    }
    this.loading = false;
    this.changeDetector.markForCheck();
    if (!this.draft) await this.router.navigateByUrl('/catalogo');
    else if (!this.user && !this.message) await this.router.navigateByUrl('/usuario');
  }

  get isClient(): boolean { return this.user?.role === 'CLIENTE'; }
  get garmentName(): string { return this.draft ? SAMPLE_GARMENT_NAMES[this.draft.garmentCode] : ''; }

  get rentalDays(): number {
    if (!this.draft) return 0;
    const start = Date.parse(`${this.draft.startDate}T00:00:00Z`);
    const end = Date.parse(`${this.draft.endDate}T00:00:00Z`);
    return Math.floor((end - start) / 86400000) + 1;
  }

  get rentalTotal(): number { return this.rentalDays * this.rentalPricePerDay; }
  get total(): number { return this.rentalTotal + this.guaranteeAmount; }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  }

  async pay(): Promise<void> {
    if (this.busy || this.loading || !this.draft) return;
    this.message = '';
    if (!this.isClient) {
      this.showMessage('Solo una cuenta Cliente puede reservar. Inicia sesión con una cuenta Cliente.', 'error'); return;
    }
    const cardError = this.validateCard();
    if (cardError) { this.showMessage(cardError, 'error'); return; }
    this.busy = true;
    try {
      this.reservation = await this.reservationService.create(this.draft.garmentCode, this.draft.startDate, this.draft.endDate);
      this.drafts.clear();
      this.clearCard();
      this.showMessage('Pago simulado aprobado. Tu reserva quedó guardada.', 'success');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.user = null;
        await this.router.navigateByUrl('/usuario');
        return;
      }
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) {
        this.drafts.clear();
        this.canRetryCatalogue = true;
      }
      this.showMessage(errorMessage(error), 'error');
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  cancel(): void {
    this.drafts.clear();
    this.clearCard();
    void this.router.navigateByUrl('/catalogo');
  }

  private validateCard(): string {
    if (!this.cardName.trim()) return 'Ingresa el nombre del titular.';
    if (!/^\d{16}$/.test(this.cardNumber.replace(/\s/g, ''))) return 'Ingresa un número de tarjeta de 16 dígitos.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.cardExpiry.trim())) return 'Ingresa el vencimiento con formato MM/AA.';
    if (!/^\d{3}$/.test(this.cardCvv)) return 'Ingresa el código de seguridad de 3 dígitos.';
    return '';
  }

  // Card fields are only used for the simulation and never leave the page.
  private clearCard(): void {
    this.cardName = this.cardNumber = this.cardExpiry = this.cardCvv = '';
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }
}
