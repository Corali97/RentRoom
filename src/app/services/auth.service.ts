import { Injectable } from '@angular/core';

export type UserRole = 'CLIENTE' | 'PROPIETARIO';

export interface RentRoomUser {
  fullName: string;
  email: string;
  role: UserRole;
}

interface StoredUser extends RentRoomUser {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersKey = 'rentroom_users';
  private readonly sessionKey = 'rentroom_session';

  register(fullName: string, email: string, password: string, role: UserRole): { ok: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    if (users.some(user => user.email === normalizedEmail)) {
      return { ok: false, message: 'El correo ya se encuentra registrado.' };
    }

    const newUser: StoredUser = { fullName: fullName.trim(), email: normalizedEmail, password, role };
    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    this.saveSession(newUser);
    return { ok: true, message: 'Cuenta creada correctamente.' };
  }

  login(email: string, password: string): { ok: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.getUsers().find(item => item.email === normalizedEmail && item.password === password);

    if (!user) {
      return { ok: false, message: 'Correo o contraseña incorrectos.' };
    }

    this.saveSession(user);
    return { ok: true, message: `Sesión iniciada como ${this.roleLabel(user.role)}.` };
  }

  getCurrentUser(): RentRoomUser | null {
    const raw = localStorage.getItem(this.sessionKey);
    return raw ? JSON.parse(raw) as RentRoomUser : null;
  }

  hasRole(role: UserRole): boolean {
    return this.getCurrentUser()?.role === role;
  }

  updateProfile(fullName: string): RentRoomUser | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const users = this.getUsers();
    const index = users.findIndex(user => user.email === current.email);
    if (index === -1) return null;

    users[index].fullName = fullName.trim();
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    const updated: RentRoomUser = { fullName: fullName.trim(), email: current.email, role: current.role };
    localStorage.setItem(this.sessionKey, JSON.stringify(updated));
    return updated;
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
  }

  roleLabel(role: UserRole): string {
    return role === 'PROPIETARIO' ? 'Propietario' : 'Cliente';
  }

  private saveSession(user: StoredUser): void {
    const session: RentRoomUser = { fullName: user.fullName, email: user.email, role: user.role ?? 'CLIENTE' };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  private getUsers(): StoredUser[] {
    const raw = localStorage.getItem(this.usersKey);
    if (!raw) return [];

    const users = JSON.parse(raw) as StoredUser[];
    return users.map(user => ({ ...user, role: user.role ?? 'CLIENTE' }));
  }
}
