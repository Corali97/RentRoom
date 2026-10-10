import { vi } from 'vitest';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogoPage } from './catalogo.page';
import { CatalogoPageModule } from './catalogo.module';
import { RentRoomProduct } from '../services/product.service';

const owner = { id: 7, fullName: 'Ana', email: 'ana@example.com', role: 'PROPIETARIO' };
const client = { id: 8, fullName: 'Camila', email: 'camila@example.com', role: 'CLIENTE' };
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

  async function openCatalogue(products: RentRoomProduct[] = [], user: typeof owner | typeof client | null = owner): Promise<void> {
    fetchMock.mockImplementationOnce(() => user ? reply({ user }) : reply({ message: 'Sin sesión' }, 401));
    fetchMock.mockImplementationOnce(() => reply({ products }));
    if (user?.role === 'CLIENTE') fetchMock.mockImplementationOnce(() => reply({ reservations: [] }));
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
    expect(fixture.nativeElement.textContent).toContain('Aún no hay productos publicados por propietarios.');
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

  it('muestra las prendas de muestra sin un error genérico si la API aún no está configurada', async () => {
    fetchMock.mockRejectedValue(new TypeError('API no disponible'));
    await component.ionViewWillEnter(); await render();
    expect(fixture.nativeElement.textContent).toContain('Polera básica');
    expect(fixture.nativeElement.textContent).toContain('Chaleco tejido');
    expect(fixture.nativeElement.textContent).not.toContain('No se pudo completar la solicitud.');
  });

  it('muestra las prendas de muestra con talla, género, precio y garantía sin conexión a Oracle', async () => {
    fetchMock.mockRejectedValue(new TypeError('API no disponible'));
    await component.ionViewWillEnter(); await render();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Polera básica');
    expect(text).toContain('Chaleco tejido');
    expect(text).toContain('Talla: M');
    expect(text).toContain('Género: Unisex');
    expect(text).toContain('10.000');
    expect(text).toContain('20.000');
  });

  it('envía la reserva a la API y muestra conflicto devuelto por Oracle', async () => {
    await openCatalogue([], client);
    const garment = component.featuredGarments[0];
    const start = new Date(`${component.minDate}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() + 1);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const dateValue = (date: Date) => date.toISOString().slice(0, 10);
    component.openBooking(garment);
    component.bookingStartDate = dateValue(start);
    component.bookingEndDate = dateValue(end);
    expect(component.rentalDays(component.bookingStartDate, component.bookingEndDate)).toBe(2);
    expect(component.rentalTotal(component.bookingStartDate, component.bookingEndDate)).toBe(20000);

    fetchMock.mockImplementationOnce(() => reply({ reservation: {
      id: 99, garmentCode: garment.id, startDate: dateValue(start), endDate: dateValue(end),
      rentalDays: 2, rentalTotal: 20000, guarantee: 20000, total: 40000,
    } }, 201));
    await component.reserveGarment(garment);
    expect(component.reservations).toHaveLength(1);
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/sample-reservations');
    expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toEqual({
      garmentCode: garment.id, startDate: dateValue(start), endDate: dateValue(end),
    });

    component.openBooking(garment);
    component.bookingStartDate = dateValue(start);
    component.bookingEndDate = dateValue(end);
    fetchMock.mockImplementationOnce(() => reply({ message: 'La prenda ya está reservada durante esas fechas.' }, 409));
    await component.reserveGarment(garment);
    expect(component.reservations).toHaveLength(1);
    expect(component.bookingMessage).toContain('ya está reservada');
    expect(component.bookingMessageType).toBe('error');
  });

  it('exige iniciar sesión para guardar una reserva', async () => {
    await openCatalogue([], null);
    const garment = component.featuredGarments[0];
    component.openBooking(garment);
    const start = new Date(`${component.minDate}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() + 1);
    const date = start.toISOString().slice(0, 10);
    component.bookingStartDate = date;
    component.bookingEndDate = date;
    fetchMock.mockImplementationOnce(() => reply({ message: 'Inicia sesión para continuar.' }, 401));
    await component.reserveGarment(garment);
    expect(component.bookingRequiresLogin).toBe(true);
    expect(component.bookingMessage).toContain('cuenta Cliente');
  });

  it('rechaza fechas pasadas o rangos invertidos sin enviar la solicitud', async () => {
    await openCatalogue([], client);
    const garment = component.featuredGarments[0];
    component.openBooking(garment);
    component.bookingStartDate = '2000-01-01';
    component.bookingEndDate = '2000-01-02';
    const previousCalls = fetchMock.mock.calls.length;
    await component.reserveGarment(garment);
    expect(component.reservations).toHaveLength(0);
    expect(component.bookingMessage).toContain('fechas válidas');
    expect(fetchMock.mock.calls).toHaveLength(previousCalls);
  });

  it('vuelve a consultar la sesión al entrar y oculta edición/publicación cuando expiró', async () => {
    await openCatalogue([product]);
    expect(component.isOwner).toBe(true);
    await openCatalogue([product], null);
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
