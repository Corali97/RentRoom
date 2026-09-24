import { AuthService } from './auth.service';

describe('AuthService: registro, sesión y perfil', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    service = new AuthService();
  });

  afterEach(() => localStorage.clear());

  it('permite registrar, cambiar el nombre, cerrar sesión y volver a entrar', () => {
    expect(service.register('  Ana Pérez  ', '  ANA@example.com  ', 'clave123', 'PROPIETARIO').ok).toBe(true);
    expect(service.getCurrentUser()).toEqual({ fullName: 'Ana Pérez', email: 'ana@example.com', role: 'PROPIETARIO' });
    expect(service.updateProfile('Ana María Pérez')).toEqual({ fullName: 'Ana María Pérez', email: 'ana@example.com', role: 'PROPIETARIO' });

    service.logout();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.login('ana@example.com', 'clave123').ok).toBe(true);
    expect(service.getCurrentUser()?.fullName).toBe('Ana María Pérez');
  });

  it('rechaza el registro duplicado y la contraseña incorrecta', () => {
    expect(service.register('Ana', 'ana@example.com', 'clave123', 'PROPIETARIO').ok).toBe(true);
    expect(service.register('Otra Ana', 'ANA@example.com', 'otra123', 'PROPIETARIO').ok).toBe(false);
    service.logout();
    expect(service.login('ana@example.com', 'incorrecta').ok).toBe(false);
    expect(service.getCurrentUser()).toBeNull();
  });
});
