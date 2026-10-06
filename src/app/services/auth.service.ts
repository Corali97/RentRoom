import { Injectable } from '@angular/core';
import { ApiError, requestApi } from './api';

export type UserRole = 'CLIENTE' | 'PROPIETARIO';

export interface RentRoomUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

interface AuthResponse {
  user: RentRoomUser;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: RentRoomUser | null = null;

  async register(fullName: string, email: string, password: string, role: UserRole): Promise<AuthResponse> {
    const result = await requestApi<AuthResponse>('/auth/register', 'POST', {
      fullName: fullName.trim(), email: email.trim().toLowerCase(), password, role,
    });
    this.currentUser = result.user;
    return result;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await requestApi<AuthResponse>('/auth/login', 'POST', { email: email.trim().toLowerCase(), password });
    this.currentUser = result.user;
    return result;
  }

  getCurrentUser(): RentRoomUser | null { return this.currentUser; }

  async refreshSession(): Promise<RentRoomUser | null> {
    try {
      const result = await requestApi<{ user: RentRoomUser }>('/auth/me');
      this.currentUser = result.user;
      return this.currentUser;
    } catch (error) {
      this.currentUser = null;
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }

  async updateProfile(fullName: string): Promise<RentRoomUser> {
    const result = await requestApi<AuthResponse>('/auth/profile', 'PATCH', { fullName: fullName.trim() });
    this.currentUser = result.user;
    return result.user;
  }

  async logout(): Promise<void> {
    await requestApi<{ message: string }>('/auth/logout', 'POST', {});
    this.currentUser = null;
  }

  roleLabel(role: UserRole): string { return role === 'PROPIETARIO' ? 'Propietario' : 'Cliente'; }
}
