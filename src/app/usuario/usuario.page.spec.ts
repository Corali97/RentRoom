import { vi } from 'vitest';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UsuarioPage } from './usuario.page';
import { UsuarioPageModule } from './usuario.module';

const user = { id: 7, fullName: 'Ana Pérez', email: 'ana@example.com', role: 'PROPIETARIO' };
const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));

describe('UsuarioPage: formularios conectados a Oracle/API', () => {
  let component: UsuarioPage;
  let fixture: ComponentFixture<UsuarioPage>;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
    await TestBed.configureTestingModule({ imports: [UsuarioPageModule], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(UsuarioPage);
    component = fixture.componentInstance;
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sin sesión' }, 401));
    await component.ionViewWillEnter();
    fixture.detectChanges(); await fixture.whenStable();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('actualiza la pantalla al enviar el formulario de inicio de sesión', async () => {
    for (const [id, value] of [['login-email', user.email], ['login-password', 'clave1234']]) {
      const input = fixture.nativeElement.querySelector('#' + id);
      input.value = value;
      input.dispatchEvent(new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
    }
    await fixture.whenStable();
    expect(component.loginEmail).toBe(user.email);
    fetchMock.mockImplementationOnce(() => reply({ user, message: 'Sesión iniciada.' }));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(component.currentUser).toEqual(user));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Mi perfil');
    expect(component.loginPassword).toBe('');
  });

  it('no anuncia inicio de sesión cuando la red falla', async () => {
    component.loginEmail = user.email; component.loginPassword = 'clave1234';
    fetchMock.mockRejectedValueOnce(new TypeError('Offline'));
    await component.submitLogin();
    expect(component.currentUser).toBeNull();
    expect(component.messageType).toBe('error');
    expect(component.message).toContain('No se pudo conectar');
  });

  it('exige al menos ocho caracteres al registrar antes de hacer una solicitud', async () => {
    component.fullName = 'Ana'; component.registerEmail = user.email; component.registerPassword = '1234567';
    await component.submitRegister();
    expect(component.message).toContain('8 caracteres');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('vuelve a comprobar la sesión al regresar y actualiza la pantalla si expiró', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user }));
    await component.ionViewWillEnter();
    expect(component.currentUser).toEqual(user);
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sesión vencida.' }, 401));
    await component.ionViewWillEnter();
    fixture.debugElement.injector.get(ChangeDetectorRef).detectChanges(); await fixture.whenStable();
    expect(component.currentUser).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Mi perfil');
  });

  it('conserva el perfil visible si no se pudo cerrar la sesión en el servidor', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user }));
    await component.ionViewWillEnter();
    fetchMock.mockRejectedValueOnce(new TypeError('Offline'));
    await component.logout();
    expect(component.currentUser).toEqual(user);
    expect(component.messageType).toBe('error');
  });
});
