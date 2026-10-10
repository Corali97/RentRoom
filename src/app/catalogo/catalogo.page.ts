import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService, RentRoomUser } from '../services/auth.service';
import { ProductForm, ProductService, RentRoomProduct } from '../services/product.service';
import { ReservationService, SampleGarmentCode, SampleReservation } from '../services/reservation.service';
import { ApiError, errorMessage } from '../services/api';

interface FeaturedGarment {
  id: SampleGarmentCode;
  name: string;
  description: string;
  category: string;
  size: string;
  gender: string;
}

@Component({ selector: 'app-catalogo', templateUrl: './catalogo.page.html', styleUrls: ['./catalogo.page.scss'], standalone: false })
export class CatalogoPage {
  readonly featuredGarments: FeaturedGarment[] = [
    { id: 'POLERA_BASICA', name: 'Polera básica', description: 'Polera cómoda para combinar en cualquier ocasión.', category: 'Poleras', size: 'M', gender: 'Unisex' },
    { id: 'CHALECO_TEJIDO', name: 'Chaleco tejido', description: 'Chaleco abrigado de tejido suave para días fríos.', category: 'Chalecos', size: 'S', gender: 'Mujer' },
  ];
  readonly rentalPricePerDay = 10000;
  readonly guaranteeAmount = 20000;
  readonly minDate = this.today();
  products: RentRoomProduct[] = [];
  reservations: SampleReservation[] = [];
  currentUser: RentRoomUser | null = null;
  editingId: number | null = null;
  bookingGarmentId: string | null = null;
  bookingStartDate = '';
  bookingEndDate = '';
  message = '';
  messageType: 'success' | 'error' = 'success';
  bookingMessage = '';
  bookingMessageType: 'success' | 'error' = 'success';
  bookingRequiresLogin = false;
  loadError = '';
  loading = true;
  busy = false;
  form: ProductForm = this.emptyForm();

  constructor(
    private productService: ProductService,
    private reservationService: ReservationService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    await this.refresh();
  }

  get isOwner(): boolean { return this.currentUser?.role === 'PROPIETARIO'; }

  openBooking(garment: FeaturedGarment): void {
    this.bookingGarmentId = garment.id;
    this.bookingStartDate = '';
    this.bookingEndDate = '';
    this.bookingMessage = '';
    this.bookingRequiresLogin = false;
  }

  closeBooking(): void {
    this.bookingGarmentId = null;
    this.bookingStartDate = '';
    this.bookingEndDate = '';
  }

  async reserveGarment(garment: FeaturedGarment): Promise<void> {
    if (this.busy) return;
    this.bookingMessage = '';
    this.bookingRequiresLogin = false;
    if (!this.bookingStartDate || !this.bookingEndDate || this.bookingStartDate < this.minDate || this.bookingEndDate < this.bookingStartDate) {
      this.showBookingError('Selecciona fechas válidas. La fecha de inicio no puede ser anterior a hoy.');
      return;
    }
    this.busy = true;
    try {
      const reservation = await this.reservationService.create(garment.id, this.bookingStartDate, this.bookingEndDate);
      this.reservations = [...this.reservations, reservation];
      this.bookingMessage = `Reserva de ${garment.name} guardada en la base de datos.`;
      this.bookingMessageType = 'success';
      this.closeBooking();
    } catch (error) {
      this.bookingMessageType = 'error';
      if (error instanceof ApiError && error.status === 401) {
        this.bookingMessage = 'Inicia sesión o crea una cuenta Cliente para guardar la reserva.';
        this.bookingRequiresLogin = true;
      } else if (error instanceof ApiError && error.status === 0) {
        this.bookingMessage = 'No se pudo conectar con la API. Iníciala y verifica que Oracle esté configurado antes de reservar.';
      } else {
        this.bookingMessage = errorMessage(error);
      }
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  rentalDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate || endDate < startDate) return 0;
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T00:00:00Z`).getTime();
    return Math.floor((end - start) / 86400000) + 1;
  }

  rentalTotal(startDate: string, endDate: string): number {
    return this.rentalDays(startDate, endDate) * this.rentalPricePerDay;
  }

  reservationsFor(garment: FeaturedGarment): SampleReservation[] {
    return this.reservations.filter(reservation => reservation.garmentCode === garment.id);
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
  }

  async saveProduct(): Promise<void> {
    if (this.busy || this.loading) return;
    if (!this.currentUser || !this.isOwner) { this.showError('Debes iniciar sesión como Propietario.'); return; }
    if (!this.form.name.trim() || !this.form.category.trim() || Number(this.form.rentalValue) <= 0 || !Number.isFinite(Number(this.form.rentalValue))) {
      this.showError('Completa nombre, categoría y valor de arriendo.'); return;
    }
    if ([this.form.purchaseValue, this.form.guarantee].some(value => value === null || !Number.isFinite(Number(value)) || Number(value) < 0)) {
      this.showError('El valor de compra y la garantía deben ser números iguales o mayores a cero.'); return;
    }
    this.busy = true;
    this.message = '';
    try {
      const data = { ...this.form, purchaseValue: Number(this.form.purchaseValue), rentalValue: Number(this.form.rentalValue), guarantee: Number(this.form.guarantee) };
      if (this.editingId !== null) {
        const original = this.products.find(product => product.id === this.editingId && this.isMine(product));
        if (!original) { this.showError('El producto ya no está disponible para editar.'); return; }
        const updated = await this.productService.update({ ...original, ...data });
        this.products = this.products.map(product => product.id === updated.id ? updated : product).filter(product => product.status === 'DISPONIBLE');
        this.message = 'Producto actualizado correctamente.';
      } else {
        const created = await this.productService.create(data);
        this.products = [created, ...this.products];
        this.message = 'Producto publicado correctamente.';
      }
      this.messageType = 'success';
      this.cancelEdit();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) this.currentUser = null;
      this.showError(errorMessage(error));
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  editProduct(product: RentRoomProduct): void {
    if (this.busy || this.loading || !this.isOwner || !this.isMine(product)) return;
    this.editingId = product.id;
    this.form = { name: product.name, description: product.description, category: product.category, purchaseValue: product.purchaseValue, rentalValue: product.rentalValue, guarantee: product.guarantee, imageUrl: product.imageUrl };
  }

  async deleteProduct(product: RentRoomProduct): Promise<void> {
    if (this.busy || this.loading || !this.isOwner || !this.isMine(product)) return;
    if (!window.confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;
    this.busy = true;
    this.message = '';
    try {
      await this.productService.remove(product.id);
      this.products = this.products.filter(item => item.id !== product.id);
      if (this.editingId === product.id) this.cancelEdit();
      this.message = 'Producto eliminado correctamente.';
      this.messageType = 'success';
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) this.currentUser = null;
      this.showError(errorMessage(error));
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  cancelEdit(): void { this.editingId = null; this.form = this.emptyForm(); }
  isMine(product: RentRoomProduct): boolean { return product.ownerEmail === this.currentUser?.email; }

  async refresh(): Promise<void> {
    if (this.busy) return;
    this.loading = true;
    this.loadError = '';
    this.currentUser = null;
    const [session, catalogue] = await Promise.allSettled([this.authService.refreshSession(), this.productService.getAll()]);
    if (session.status === 'fulfilled') {
      this.currentUser = session.value;
      if (session.value?.role === 'CLIENTE') {
        try {
          this.reservations = await this.reservationService.getMine();
        } catch {
          this.reservations = [];
        }
      }
    }
    if (catalogue.status === 'fulfilled') this.products = catalogue.value;
    else this.products = [];
    if (!this.isOwner) this.cancelEdit();
    this.loading = false;
    this.changeDetector.markForCheck();
  }

  private showBookingError(message: string): void {
    this.bookingMessage = message;
    this.bookingMessageType = 'error';
  }

  private today(): string {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  }

  private showError(message: string): void { this.message = message; this.messageType = 'error'; }
  private emptyForm(): ProductForm { return { name: '', description: '', category: '', purchaseValue: 0, rentalValue: 0, guarantee: 0, imageUrl: '' }; }
}
