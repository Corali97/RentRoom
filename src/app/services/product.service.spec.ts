import { ProductService, RentRoomProduct } from './product.service';

describe('ProductService: conservar productos en todos los estados', () => {
  let service: ProductService;
  const available: RentRoomProduct = { id: 1, ownerEmail: 'ana@example.com', name: 'Vestido', description: 'Azul', category: 'Ropa', purchaseValue: 50000, rentalValue: 5000, guarantee: 10000, imageUrl: '', status: 'DISPONIBLE' };
  const inactive: RentRoomProduct = { ...available, id: 2, status: 'INACTIVO' };
  const stored = (): RentRoomProduct[] => JSON.parse(localStorage.getItem('rentroom_products') ?? '[]');

  beforeEach(() => { localStorage.clear(); service = new ProductService(); service.save([available, inactive]); });
  afterEach(() => localStorage.clear());

  it('muestra solo disponibles sin modificar el almacenamiento', () => {
    expect(service.getAll()).toEqual([available]);
    expect(stored()).toEqual([available, inactive]);
  });
  it('publica sin perder productos inactivos', () => {
    service.create({ ...available, name: 'Nuevo' });
    expect(stored()).toHaveLength(3);
    expect(stored()).toContainEqual(inactive);
    expect(service.getAll().map(p => p.name)).toContain('Nuevo');
  });
  it('edita sin perder productos inactivos', () => {
    service.update({ ...available, name: 'Editado' });
    expect(stored()).toEqual([{ ...available, name: 'Editado' }, inactive]);
  });
  it('puede actualizar un producto inactivo', () => {
    service.update({ ...inactive, name: 'Inactivo editado' });
    expect(stored()).toEqual([available, { ...inactive, name: 'Inactivo editado' }]);
  });
  it('elimina solo el producto del propietario indicado', () => {
    service.remove(available.id, 'otra@example.com');
    expect(stored()).toEqual([available, inactive]);
    service.remove(available.id, available.ownerEmail);
    expect(stored()).toEqual([inactive]);
  });
  it('elimina un inactivo sin alterar otros productos', () => {
    service.remove(inactive.id, inactive.ownerEmail);
    expect(stored()).toEqual([available]);
  });
  it('conserva todo si el identificador no existe', () => {
    service.update({ ...available, id: 999 });
    service.remove(999, available.ownerEmail);
    expect(stored()).toEqual([available, inactive]);
  });
});
