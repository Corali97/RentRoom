import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService, RentRoomUser } from '../services/auth.service';
import { ProductForm, ProductService, RentRoomProduct } from '../services/product.service';
import { ApiError, errorMessage } from '../services/api';

@Component({ selector: 'app-catalogo', templateUrl: './catalogo.page.html', styleUrls: ['./catalogo.page.scss'], standalone: false })
export class CatalogoPage {
  products: RentRoomProduct[] = [];
  currentUser: RentRoomUser | null = null;
  editingId: number | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';
  loadError = '';
  loading = true;
  busy = false;
  form: ProductForm = this.emptyForm();

  constructor(private productService: ProductService, private authService: AuthService, private changeDetector: ChangeDetectorRef) {}

  async ionViewWillEnter(): Promise<void> {
    await this.refresh();
  }

  get isOwner(): boolean { return this.currentUser?.role === 'PROPIETARIO'; }

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
    if (session.status === 'fulfilled') this.currentUser = session.value;
    else this.showError(errorMessage(session.reason));
    if (catalogue.status === 'fulfilled') this.products = catalogue.value;
    else {
      this.products = [];
      this.loadError = errorMessage(catalogue.reason);
    }
    if (!this.isOwner) this.cancelEdit();
    this.loading = false;
    this.changeDetector.markForCheck();
  }

  private showError(message: string): void { this.message = message; this.messageType = 'error'; }
  private emptyForm(): ProductForm { return { name: '', description: '', category: '', purchaseValue: 0, rentalValue: 0, guarantee: 0, imageUrl: '' }; }
}
