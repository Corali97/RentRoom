import { Injectable } from '@angular/core';

export interface RentRoomUser {
  fullName: string;
  email: string;
}

interface StoredUser extends RentRoomUser {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersKey = 'rentroom_users';
  private readonly sessionKey = 'rentroom_session';

  register(fullName: string, email: string, password: string): { ok: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    if (users.some(user => user.email === normalizedEmail)) {
      return { ok: false, message: 'El correo ya se encuentra registrado.' };
    }

    users.push({ fullName: fullName.trim(), email: normalizedEmail, password });
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    localStorage.setItem(this.sessionKey, JSON.stringify({ fullName: fullName.trim(), email: normalizedEmail }));
    return { ok: true, message: 'Cuenta creada correctamente.' };
  }

  login(email: string, password: string): { ok: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.getUsers().find(item => item.email === normalizedEmail && item.password === password);

    if (!user) {
      return { ok: false, message: 'Correo o contraseña incorrectos.' };
    }

    localStorage.setItem(this.sessionKey, JSON.stringify({ fullName: user.fullName, email: user.email }));
    return { ok: true, message: 'Sesión iniciada correctamente.' };
  }

  getCurrentUser(): RentRoomUser | null {
    const raw = localStorage.getItem(this.sessionKey);
    return raw ? JSON.parse(raw) as RentRoomUser : null;
  }

  updateProfile(fullName: string): RentRoomUser | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const users = this.getUsers();
    const index = users.findIndex(user => user.email === current.email);
    if (index === -1) return null;

    users[index].fullName = fullName.trim();
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    const updated = { fullName: fullName.trim(), email: current.email };
    localStorage.setItem(this.sessionKey, JSON.stringify(updated));
    return updated;
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
  }

  private getUsers(): StoredUser[] {
    const raw = localStorage.getItem(this.usersKey);
    return raw ? JSON.parse(raw) as StoredUser[] : [];
  }
}
