import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogoPage } from './catalogo.page';
import { CatalogoPageModule } from './catalogo.module';
import { AuthService } from '../services/auth.service';
import { ProductService, RentRoomProduct } from '../services/product.service';

describe('CatalogoPage', () => {
  let component: CatalogoPage;
  let fixture: ComponentFixture<CatalogoPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [CatalogoPageModule], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(CatalogoPage);
    component = fixture.componentInstance;
    fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges(); await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  function loginOwner() {
    TestBed.inject(AuthService).register('Ana', 'ana@example.com', 'clave123', 'PROPIETARIO');
    component.ionViewWillEnter();
  }

  function fillForm() {
    component.form = { name: 'Vestido azul', description: 'Para fiesta', category: 'Vestidos', purchaseValue: 50000, rentalValue: 5000, guarantee: 10000, imageUrl: '' };
  }

  async function clickButton(label: string) {
    fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges(); await fixture.whenStable();
    const button = Array.from(fixture.nativeElement.querySelectorAll('ion-button') as NodeListOf<HTMLElement>).find(el => el.textContent?.trim() === label);
    expect(button).toBeTruthy();
    button!.click();
    fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges(); await fixture.whenStable();
  }

  it('HU-04/05/06: publica, visualiza, edita y elimina desde los botones', async () => {
    loginOwner();
    fillForm();
    await clickButton('Publicar producto');
    expect(component.products).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Vestido azul');
    expect(new ProductService().getAll()[0].ownerEmail).toBe('ana@example.com');
    await clickButton('Editar');
    component.form.name = 'Vestido actualizado';
    await clickButton('Guardar cambios');
    expect(new ProductService().getAll()[0].name).toBe('Vestido actualizado');
    expect(fixture.nativeElement.textContent).toContain('Vestido actualizado');
    await clickButton('Eliminar');
    expect(new ProductService().getAll()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Aún no hay productos publicados.');
  });

  it('HU-04: rechaza visitantes y clientes', async () => {
    fillForm();
    component.saveProduct();
    expect(new ProductService().getAll()).toEqual([]);
    TestBed.inject(AuthService).register('Cliente', 'cliente@example.com', 'clave123', 'CLIENTE');
    component.ionViewWillEnter();
    component.saveProduct();
    expect(new ProductService().getAll()).toEqual([]);
    fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('ion-input')).toBeNull();
  });

  it('HU-04: exige nombre, categoría y arriendo positivo', async () => {
    loginOwner();
    for (const invalid of [{ name: ' ' }, { category: ' ' }, { rentalValue: 0 }, { rentalValue: -1 }]) {
      fillForm();
      Object.assign(component.form, invalid);
      component.saveProduct();
      expect(new ProductService().getAll()).toEqual([]);
    }
  });

  it('HU-05: impide editar o eliminar productos ajenos', async () => {
    loginOwner();
    fillForm();
    const other: RentRoomProduct = { ...component.form, id: 12, ownerEmail: 'otra@example.com', status: 'DISPONIBLE' };
    TestBed.inject(ProductService).save([other]);
    component.ionViewWillEnter();
    component.editProduct(other);
    expect(component.editingId).toBeNull();
    component.deleteProduct(other);
    expect(new ProductService().getAll()).toEqual([other]);
    fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges(); await fixture.whenStable();
    expect(Array.from(fixture.nativeElement.querySelectorAll('ion-button') as NodeListOf<HTMLElement>).some(el => ['Editar', 'Eliminar'].includes(el.textContent?.trim() ?? ''))).toBe(false);
  });

  it('HU-05: cancelar conserva el producto original', async () => {
    loginOwner(); fillForm(); component.saveProduct();
    component.editProduct(component.products[0]);
    component.form.name = 'Cambio cancelado';
    await clickButton('Cancelar');
    expect(component.editingId).toBeNull();
    expect(new ProductService().getAll()[0].name).toBe('Vestido azul');
  });

  it('HU-06: visitante visualiza disponibles y no inactivos al entrar', async () => {
    fillForm();
    const available: RentRoomProduct = { ...component.form, id: 1, ownerEmail: 'ana@example.com', status: 'DISPONIBLE' };
    TestBed.inject(ProductService).save([available, { ...available, id: 2, name: 'Oculto', status: 'INACTIVO' }]);
    component.ionViewWillEnter(); fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges(); await fixture.whenStable();
    expect(component.products).toEqual([available]);
    expect(fixture.nativeElement.textContent).toContain('Vestido azul');
    expect(fixture.nativeElement.textContent).not.toContain('Oculto');
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  });
});
