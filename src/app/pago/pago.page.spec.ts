import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PagoPage } from './pago.page';
import { PagoPageModule } from './pago.module';
import { BookingDraftService } from '../services/booking-draft.service';

const client = { id: 8, fullName: 'Camila', email: 'camila@example.com', role: 'CLIENTE' };
const draft = { garmentCode: 'POLERA_BASICA' as const, startDate: '2030-01-01', endDate: '2030-01-02' };
const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));

describe('PagoPage: pago simulado y guardado de la reserva', () => {
  let component: PagoPage;
  let fixture: ComponentFixture<PagoPage>;
  let navigate: ReturnType<typeof vi.spyOn>;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
    await TestBed.configureTestingModule({ imports: [PagoPageModule], providers: [provideRouter([])] }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(PagoPage);
    component = fixture.componentInstance;
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); sessionStorage.clear(); });

  function fillCard(): void {
    component.cardName = 'Camila Rojas'; component.cardNumber = '4242 4242 4242 4242';
    component.cardExpiry = '12/30'; component.cardCvv = '123';
  }

  it('vuelve al catálogo si no hay una reserva pendiente', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user: client }));
    await component.ionViewWillEnter();
    expect(navigate).toHaveBeenCalledWith('/catalogo');
  });

  it('vuelve a iniciar sesión si no hay sesión activa', async () => {
    TestBed.inject(BookingDraftService).save(draft);
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sin sesión' }, 401));
    await component.ionViewWillEnter();
    expect(navigate).toHaveBeenCalledWith('/usuario');
  });

  it('calcula el total y valida la tarjeta antes de guardar', async () => {
    TestBed.inject(BookingDraftService).save(draft);
    fetchMock.mockImplementationOnce(() => reply({ user: client }));
    await component.ionViewWillEnter();
    expect(component.total).toBe(40000);
    const calls = fetchMock.mock.calls.length;
    await component.pay();
    expect(component.message).toContain('titular');
    expect(fetchMock.mock.calls).toHaveLength(calls);
  });

  it('guarda la reserva en la API sólo al pagar y limpia el borrador y la tarjeta', async () => {
    TestBed.inject(BookingDraftService).save(draft);
    fetchMock.mockImplementationOnce(() => reply({ user: client }));
    await component.ionViewWillEnter();
    fillCard();
    fetchMock.mockImplementationOnce(() => reply({ reservation: {
      id: 5, garmentCode: draft.garmentCode, startDate: draft.startDate, endDate: draft.endDate,
      rentalDays: 2, rentalTotal: 20000, guarantee: 20000, total: 40000,
    } }, 201));
    await component.pay();
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/sample-reservations');
    const body = String(fetchMock.mock.calls.at(-1)?.[1]?.body);
    expect(JSON.parse(body)).toEqual(draft);
    expect(body).not.toContain('4242');
    expect(component.reservation?.id).toBe(5);
    expect(component.cardNumber).toBe('');
    expect(TestBed.inject(BookingDraftService).get()).toBeNull();
  });

  it('no confirma la reserva si el servidor la rechaza por fechas ocupadas', async () => {
    TestBed.inject(BookingDraftService).save(draft);
    fetchMock.mockImplementationOnce(() => reply({ user: client }));
    await component.ionViewWillEnter();
    fillCard();
    fetchMock.mockImplementationOnce(() => reply({ message: 'La prenda ya está reservada durante esas fechas.' }, 409));
    await component.pay();
    expect(component.reservation).toBeNull();
    expect(component.messageType).toBe('error');
    expect(component.canRetryCatalogue).toBe(true);
  });
});
