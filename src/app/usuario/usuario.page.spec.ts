import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UsuarioPage } from './usuario.page';

describe('UsuarioPage', () => {
  let component: UsuarioPage;
  let fixture: ComponentFixture<UsuarioPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(UsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
