import { vi } from 'vitest';
import { ProductService, RentRoomProduct } from './product.service';

const product: RentRoomProduct = { id: 41, ownerEmail: 'ana@example.com', name: 'Vestido', description: 'Azul', category: 'Ropa', purchaseValue: 50000, rentalValue: 5000, guarantee: 10000, imageUrl: '', status: 'DISPONIBLE' };
const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));

describe('ProductService: catálogo respaldado por el servidor', () => {
  let service: ProductService;
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => { localStorage.clear(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); service = new ProductService(); });
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

  it('lee productos del servidor e ignora el almacenamiento antiguo del navegador', async () => {
    localStorage.setItem('rentroom_products', JSON.stringify([{ ...product, name: 'Solo local' }]));
    fetchMock.mockImplementationOnce(() => reply({ products: [product, { ...product, id: 42, status: 'INACTIVO' }] }));
    expect(await service.getAll()).toEqual([product]);
  });

  it('publica con el identificador asignado por el servidor y no envía un propietario editable', async () => {
    fetchMock.mockImplementationOnce(() => reply({ product }, 201));
    expect(await service.create(product)).toEqual(product);
    const options = fetchMock.mock.calls[0][1]!;
    const body = JSON.parse(options.body as string);
    expect(options.credentials).toBe('include');
    expect(body.ownerEmail).toBeUndefined();
    expect(body.id).toBeUndefined();
    expect(localStorage.length).toBe(0);
  });

  it('propaga el rechazo de edición ajena sin escribir datos locales', async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: 'No puedes editar este producto.' }, 403));
    await expect(service.update({ ...product, name: 'Otro nombre' })).rejects.toThrow('No puedes editar este producto.');
    expect(localStorage.length).toBe(0);
  });

  it('pide la baja del producto al servidor sin enviar un correo como autorización', async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: 'Eliminado.' }));
    await service.remove(product.id);
    expect(fetchMock).toHaveBeenCalledWith('/api/products/41', expect.objectContaining({ method: 'DELETE', credentials: 'include', body: undefined }));
  });

  it('no convierte una caída de Oracle/API en un catálogo vacío', async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: 'La base de datos no está disponible.' }, 503));
    await expect(service.getAll()).rejects.toThrow('La base de datos no está disponible.');
  });
});
