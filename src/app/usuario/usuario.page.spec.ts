import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UsuarioPage } from './usuario.page';
import { UsuarioPageModule } from './usuario.module';
import { AuthService } from '../services/auth.service';

describe('UsuarioPage', () => {
  let component: UsuarioPage;
  let fixture: ComponentFixture<UsuarioPage>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [UsuarioPageModule], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(UsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('actualiza la pantalla al enviar el formulario de inicio de sesión', async () => {
    const auth = TestBed.inject(AuthService);
    auth.register('Ana', 'ana@example.com', 'clave123', 'PROPIETARIO');
    auth.logout();
    await fixture.whenStable();
    for (const [id, value] of [['login-email', 'ana@example.com'], ['login-password', 'clave123']]) {
      const input = fixture.nativeElement.querySelector('#' + id);
      input.value = value;
      input.dispatchEvent(new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
    }
    await fixture.whenStable();
    expect(component.loginEmail).toBe('ana@example.com');
    expect(component.loginPassword).toBe('clave123');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(auth.getCurrentUser()?.email).toBe('ana@example.com');
    expect(fixture.nativeElement.textContent).toContain('Mi perfil');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rechaza un correo inválido al registrar', () => {
    localStorage.clear();
    component.fullName = 'Ana Pérez';
    component.registerEmail = 'correo-invalido';
    component.registerPassword = 'clave123';

    component.submitRegister();

    expect(component.messageType).toBe('error');
    expect(component.currentUser).toBeNull();
    expect(localStorage.getItem('rentroom_users')).toBeNull();
  });
});
