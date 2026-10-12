import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService, RentRoomUser } from '../services/auth.service';
import { ProductService, RentRoomProduct } from '../services/product.service';
import { ReservationService, RentRoomReservation, ReservedPeriod } from '../services/reservation.service';
import { errorMessage } from '../services/api';

@Component({selector: 'app-reservas',templateUrl: './reservas.page.html',standalone: false})
export class ReservasPage {
  user: RentRoomUser | null = null;
  products: RentRoomProduct[] = [];
  reservations: RentRoomReservation[] = [];
  occupied: ReservedPeriod[] = [];
  productId: number | null = null;
  startDate = '';
  endDate = '';
  loading = false;
  busy = false;
  message = '';
  error = '';
  constructor(
    private auth: AuthService, private productApi: ProductService,
    private reservationApi: ReservationService, private cd: ChangeDetectorRef
  ) {}

  async ionViewWillEnter(): Promise<void> { await this.refresh(); }

  async refresh(): Promise<void> {
    this.loading = true; this.error = '';
    try {
      this.user = await this.auth.refreshSession();
      const [products,reservations] = await Promise.all([
        this.productApi.getAll(),
        this.user?.role === 'CLIENTE' ? this.reservationApi.list() :
        this.user?.role === 'PROPIETARIO' ? this.reservationApi.ownerList() : Promise.resolve([])
      ]);
      this.products = products; this.reservations = reservations;
      if (this.productId && !products.some(p => p.id === Number(this.productId))) this.productId = null;
      if (this.productId) await this.checkAvailability();
    } catch(e) { this.error = errorMessage(e); }
    finally { this.loading = false; this.cd.markForCheck(); }
  }
  async checkAvailability(): Promise<void> {
    this.occupied = []; this.error = '';
    if (!this.productId) return;
    try { this.occupied = await this.reservationApi.occupied(Number(this.productId)); }
    catch(e) { this.error = errorMessage(e); }
    finally { this.cd.markForCheck(); }
  }
  async reserve(): Promise<void> {
    if (this.busy) return;
    this.error = ''; this.message = '';
    if (this.user?.role !== 'CLIENTE') { this.error = 'Inicia sesión como Cliente.'; return; }
    if (!this.productId || !this.startDate || !this.endDate || this.startDate > this.endDate) {
      this.error = 'Selecciona un producto y fechas válidas.'; return;
    }
    const now = new Date();
    const today = [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    if (this.startDate < today) { this.error = 'No puedes reservar fechas anteriores a hoy.'; return; }
    if (this.occupied.some(x => this.startDate <= x.endDate && this.endDate >= x.startDate)) {
      this.error = 'El producto está reservado para esas fechas.'; return;
    }
    this.busy = true;
    try {
      await this.reservationApi.create(Number(this.productId),this.startDate,this.endDate);
      this.message = 'Solicitud de reserva registrada.';
      this.startDate = ''; this.endDate = '';
      await this.refresh();
    } catch(e) { this.error = errorMessage(e); }
    finally { this.busy = false; this.cd.markForCheck(); }
  }
  async cancel(r: RentRoomReservation): Promise<void> {
    if (this.busy || this.user?.role !== 'CLIENTE' || !['PENDIENTE','CONFIRMADA'].includes(r.status)) return;
    if (!window.confirm('¿Cancelar esta reserva?')) return;
    this.busy = true; this.error = '';
    try { await this.reservationApi.cancel(r.id); this.message = 'Reserva cancelada.'; await this.refresh(); }
    catch(e) { this.error = errorMessage(e); }
    finally { this.busy = false; this.cd.markForCheck(); }
  }
  async confirm(r: RentRoomReservation): Promise<void> {
    if (this.busy || this.user?.role !== 'PROPIETARIO' || r.status !== 'PENDIENTE') return;
    if (!window.confirm('¿Confirmar esta reserva?')) return;
    this.busy = true; this.error = '';
    try { await this.reservationApi.confirm(r.id); this.message = 'Reserva confirmada.'; await this.refresh(); }
    catch(e) { this.error = errorMessage(e); }
    finally { this.busy = false; this.cd.markForCheck(); }
  }
  async track(r: RentRoomReservation,action: 'ENTREGAR'|'DEVOLVER'|'DANO'|'LIBERAR_GARANTIA'|'RETENER_GARANTIA'): Promise<void> {
    if (this.busy || this.user?.role !== 'PROPIETARIO' || !['CONFIRMADA','FINALIZADA'].includes(r.status)) return;
    const detail = action === 'DANO' ? window.prompt('Describe el daño:') : '';
    if (detail === null || (action === 'DANO' && !detail.trim())) return;
    if (!window.confirm('¿Registrar ' + action.toLowerCase().replaceAll('_',' ') + '?')) return;
    this.busy = true; this.error = '';
    try { await this.reservationApi.track(r.id,action,detail); this.message = 'Seguimiento actualizado.'; await this.refresh(); }
    catch(e) { this.error = errorMessage(e); }
    finally { this.busy = false; this.cd.markForCheck(); }
  }
  async showHistory(r: RentRoomReservation): Promise<void> {
    try {
      const data = await this.reservationApi.history(r.id);
      window.alert('Garantía: ' + data.guaranteeStatus + '\nDaños: ' +
        (data.damageNotes || 'Sin registro') + '\n' +
        data.events.map(e => e.date + ' ' + e.action + ' ' + (e.detail || '')).join('\n'));
    } catch(e) { this.error = errorMessage(e); this.cd.markForCheck(); }
  }
}
