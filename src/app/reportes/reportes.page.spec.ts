import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ReportesPage } from './reportes.page';
import { ReportesPageModule } from './reportes.module';

const client = { id: 8, fullName: 'Camila', email: 'camila@example.com', role: 'CLIENTE' };
const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));
const reservations = [
  { id: 1, garmentCode: 'POLERA_BASICA', startDate: '2030-01-01', endDate: '2030-01-02', rentalDays: 2, rentalTotal: 20000, guarantee: 20000, total: 40000 },
  { id: 2, garmentCode: 'CHALECO_TEJIDO', startDate: '2030-03-01', endDate: '2030-03-01', rentalDays: 1, rentalTotal: 10000, guarantee: 20000, total: 30000 },
];

describe('ReportesPage: reporte de reservas', () => {
  let component: ReportesPage;
  let fixture: ComponentFixture<ReportesPage>;
  let navigate: ReturnType<typeof vi.spyOn>;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
    await TestBed.configureTestingModule({ imports: [ReportesPageModule], providers: [provideRouter([])] }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(ReportesPage);
    component = fixture.componentInstance;
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('totaliza reservas y resume por prenda', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user: client })).mockImplementationOnce(() => reply({ reservations }));
    await component.ionViewWillEnter();
    expect(component.filtered.length).toBe(2);
    expect(component.totalDays).toBe(3);
    expect(component.grandTotal).toBe(70000);
    expect(component.summary.map(row => row.name)).toEqual(['Polera básica', 'Chaleco tejido']);
  });

  it('filtra por rango de fechas y genera CSV', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user: client })).mockImplementationOnce(() => reply({ reservations }));
    await component.ionViewWillEnter();
    component.fromDate = '2030-02-01';
    expect(component.filtered.map(item => item.id)).toEqual([2]);
    expect(component.csvContent().split('\r\n')).toHaveLength(2);
    expect(component.csvContent()).toContain('"Chaleco tejido";"2030-03-01"');
  });

  it('redirige a iniciar sesión sin sesión activa', async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sin sesión' }, 401));
    await component.ionViewWillEnter();
    expect(navigate).toHaveBeenCalledWith('/usuario');
  });
});
