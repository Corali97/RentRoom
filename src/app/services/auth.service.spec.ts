import { vi } from 'vitest';
import { AuthService, RentRoomUser } from './auth.service';

const user: RentRoomUser = { id: 7, fullName: 'Ana Pérez', email: 'ana@example.com', role: 'PROPIETARIO' };
const reply = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));

describe('AuthService: sesión y usuarios del servidor', () => {
  let service: AuthService;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => { localStorage.clear(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); service = new AuthService(); });
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

  it('registra con cookie de sesión y no guarda la contraseña ni el usuario en localStorage', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user, message: 'Cuenta creada.' }, 201));
    const result = await service.register(' Ana Pérez ', ' ANA@example.com ', 'clave1234', 'PROPIETARIO');
    expect(result.user).toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST', credentials: 'include', body: JSON.stringify({ fullName: 'Ana Pérez', email: 'ana@example.com', password: 'clave1234', role: 'PROPIETARIO' }),
    }));
    expect(localStorage.length).toBe(0);
    expect(service.getCurrentUser()).toEqual(user);
  });

  it('ignora una sesión fabricada en localStorage y consulta al servidor', async () => {
    localStorage.setItem('rentroom_session', JSON.stringify(user));
    expect(service.getCurrentUser()).toBeNull();
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sesión requerida.' }, 401));
    expect(await service.refreshSession()).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ credentials: 'include' }));
  });

  it('borra la sesión en memoria cuando el servidor informa que expiró', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user, message: 'OK' }));
    await service.login(user.email, 'clave1234');
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sesión vencida.' }, 401));
    expect(await service.refreshSession()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('distingue una falla de conexión de una sesión anónima', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network error'));
    await expect(service.refreshSession()).rejects.toThrow('No se pudo conectar con RentRoom');
    expect(service.getCurrentUser()).toBeNull();
  });

  it('propaga el rechazo de correo duplicado y no crea una sesión local', async () => {
    fetchMock.mockImplementationOnce(() => reply({ message: 'El correo ya se encuentra registrado.' }, 409));
    await expect(service.register('Ana', user.email, 'clave1234', 'PROPIETARIO')).rejects.toThrow('El correo ya se encuentra registrado.');
    expect(service.getCurrentUser()).toBeNull();
  });

  it('actualiza el perfil con el usuario confirmado por el servidor', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user: { ...user, fullName: 'Ana María' }, message: 'OK' }));
    expect((await service.updateProfile(' Ana María ')).fullName).toBe('Ana María');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/profile', expect.objectContaining({ method: 'PATCH', body: '{"fullName":"Ana María"}' }));
  });

  it('no anuncia cierre de sesión si la solicitud falló y sí la limpia al confirmarse', async () => {
    fetchMock.mockImplementationOnce(() => reply({ user, message: 'OK' }));
    await service.login(user.email, 'clave1234');
    fetchMock.mockRejectedValueOnce(new TypeError('Offline'));
    await expect(service.logout()).rejects.toThrow();
    expect(service.getCurrentUser()).toEqual(user);
    fetchMock.mockImplementationOnce(() => reply({ message: 'Sesión cerrada.' }));
    await service.logout();
    expect(service.getCurrentUser()).toBeNull();
  });
});
