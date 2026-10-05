import { vi } from 'vitest';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogoPage } from './catalogo.page';
import { CatalogoPageModule } from './catalogo.module';
import { RentRoomProduct } from '../services/product.service';

const owner = { id: 7, fullName: 'Ana', email: 'ana@example.com', role: 'PROPIETARIO' };
const product: RentRoomProduct = { id: 41, ownerEmail: owner.email, name: 'Vestido azul', description: 'Para fiesta', category: 'Vestidos', purchaseValue: 50000, rentalValue: 5000, guarantee: 10000, imageUrl: '', status: 'DISPONIBLE' };
const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));

describe('CatalogoPage: persistencia y errores de API', () => {
  let component: CatalogoPage;
  let fixture: ComponentFixture<CatalogoPage>;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await TestBed.configureTestingModule({ imports: [CatalogoPageModule], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(CatalogoPage);
    component = fixture.componentInstance;
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  async function openCatalogue(products: RentRoomProduct[] = [], signedIn = true): Promise<void> {
    fetchMock.mockImplementationOnce(() => signedIn ? reply({ user: owner }) : reply({ message: 'Sin sesión' }, 401));
    fetchMock.mockImplementationOnce(() => reply({ products }));
    await component.ionViewWillEnter();
    await render();
  }
  async function render(): Promise<void> {
    fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges();
    await fixture.whenStable();
  }
  function fillForm(): void {
    component.form = { name: product.name, description: product.description, category: product.category, purchaseValue: product.purchaseValue, rentalValue: product.rentalValue, guarantee: product.guarantee, imageUrl: '' };
  }

  it('publica, edita y elimina únicamente después de la confirmación del servidor', async () => {
    await openCatalogue(); fillForm();
    fetchMock.mockImplementationOnce(() => reply({ product }, 201));
    await component.saveProduct(); await render();
    expect(fixture.nativeElement.textContent).toContain('Vestido azul');
    component.editProduct(product);
    component.form.name = 'Vestido actualizado';
    fetchMock.mockImplementationOnce(() => reply({ product: { ...product, name: 'Vestido actualizado' } }));
    await component.saveProduct(); await render();
    expect(fixture.nativeElement.textContent).toContain('Vestido actualizado');
    fetchMock.mockImplementationOnce(() => reply({ message: 'Eliminado' }));
    await component.deleteProduct(component.products[0]); await render();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay productos publicados.');
  });

  it('conserva los datos del formulario cuando falla la publicación', async () => {
    await openCatalogue(); fillForm();
    fetchMock.mockRejectedValueOnce(new TypeError('Network error'));
    await component.saveProduct(); await render();
    expect(component.form.name).toBe(product.name);
    expect(component.products).toEqual([]);
    expect(component.messageType).toBe('error');
    expect(fixture.nativeElement.textContent).not.toContain('Producto publicado correctamente.');
    expect(component.busy).toBe(false);
  });

  it('mantiene el producto visible si el servidor rechaza la eliminación', async () => {
    await openCatalogue([product]);
    fetchMock.mockImplementationOnce(() => reply({ message: 'No se puede eliminar un producto reservado.' }, 409));
    await component.deleteProduct(product);
    expect(component.products).toEqual([product]);
    expect(component.message).toContain('No se puede eliminar');
  });

  it('muestra un error recuperable sin presentar una falla como catálogo vacío', async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sin sesión' }, 401));
    fetchMock.mockImplementationOnce(() => reply({ message: 'La base de datos no está disponible.' }, 503));
    await component.ionViewWillEnter(); await render();
    expect(fixture.nativeElement.textContent).toContain('La base de datos no está disponible.');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    expect(fixture.nativeElement.textContent).not.toContain('Aún no hay productos publicados.');
  });

  it('vuelve a consultar la sesión al entrar y oculta edición/publicación cuando expiró', async () => {
    await openCatalogue([product]);
    expect(component.isOwner).toBe(true);
    await openCatalogue([product], false);
    expect(component.isOwner).toBe(false);
    expect(fixture.nativeElement.querySelector('ion-input')).toBeNull();
    const priorCalls = fetchMock.mock.calls.length;
    fillForm(); await component.saveProduct();
    expect(fetchMock.mock.calls.length).toBe(priorCalls);
  });

  it('rechaza importes inválidos antes de enviar y evita controles de edición ajenos', async () => {
    await openCatalogue([product]); fillForm();
    component.form.rentalValue = -1;
    const priorCalls = fetchMock.mock.calls.length;
    await component.saveProduct();
    expect(fetchMock.mock.calls.length).toBe(priorCalls);
    component.editProduct({ ...product, ownerEmail: 'otra@example.com' });
    expect(component.editingId).toBeNull();
  });
});
