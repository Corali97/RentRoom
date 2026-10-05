import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService, RentRoomUser, UserRole } from '../services/auth.service';
import { ApiError, errorMessage } from '../services/api';

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.page.html',
  styleUrls: ['./usuario.page.scss'],
  standalone: false,
})
export class UsuarioPage {
  authMode: 'login' | 'register' = 'login';
  loginEmail = '';
  loginPassword = '';
  fullName = '';
  registerEmail = '';
  registerPassword = '';
  registerRole: UserRole = 'CLIENTE';
  currentUser: RentRoomUser | null = null;
  profileName = '';
  message = '';
  messageType: 'success' | 'error' = 'success';
  loading = true;
  busy = false;

  constructor(private authService: AuthService, private changeDetector: ChangeDetectorRef) {}

  async ionViewWillEnter(): Promise<void> {
    this.loading = true;
    this.message = '';
    this.currentUser = null;
    try {
      this.currentUser = await this.authService.refreshSession();
      this.profileName = this.currentUser?.fullName ?? '';
    } catch (error) {
      this.showMessage(errorMessage(error), 'error');
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }

  async submitLogin(): Promise<void> {
    if (this.busy || this.loading) return;
    this.message = '';
    if (!this.loginEmail.trim() || !this.loginPassword) {
      this.showMessage('Completa correo y contraseña.', 'error'); return;
    }
    if (!this.isValidEmail(this.loginEmail)) {
      this.showMessage('Ingresa un correo electrónico válido.', 'error'); return;
    }
    this.busy = true;
    try {
      const result = await this.authService.login(this.loginEmail, this.loginPassword);
      this.currentUser = result.user;
      this.profileName = result.user.fullName;
      this.loginPassword = '';
      this.showMessage(result.message, 'success');
    } catch (error) {
      this.showMessage(errorMessage(error), 'error');
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  async submitRegister(): Promise<void> {
    if (this.busy || this.loading) return;
    this.message = '';
    if (!this.fullName.trim() || !this.registerEmail.trim() || !this.registerPassword) {
      this.showMessage('Completa todos los campos.', 'error'); return;
    }
    if (!this.isValidEmail(this.registerEmail)) {
      this.showMessage('Ingresa un correo electrónico válido.', 'error'); return;
    }
    if (this.registerPassword.length < 8) {
      this.showMessage('La contraseña debe tener al menos 8 caracteres.', 'error'); return;
    }
    this.busy = true;
    try {
      const result = await this.authService.register(this.fullName, this.registerEmail, this.registerPassword, this.registerRole);
      this.currentUser = result.user;
      this.profileName = result.user.fullName;
      this.registerPassword = '';
      this.showMessage(result.message, 'success');
    } catch (error) {
      this.showMessage(errorMessage(error), 'error');
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  async saveProfile(): Promise<void> {
    if (this.busy || this.loading) return;
    if (!this.profileName.trim()) {
      this.showMessage('El nombre no puede quedar vacío.', 'error'); return;
    }
    this.busy = true;
    this.message = '';
    try {
      this.currentUser = await this.authService.updateProfile(this.profileName);
      this.profileName = this.currentUser.fullName;
      this.showMessage('Perfil actualizado correctamente.', 'success');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) this.currentUser = null;
      this.showMessage(errorMessage(error), 'error');
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  async logout(): Promise<void> {
    if (this.busy || this.loading) return;
    this.busy = true;
    this.message = '';
    try {
      await this.authService.logout();
      this.currentUser = null;
      this.profileName = '';
      this.authMode = 'login';
      this.showMessage('Sesión cerrada.', 'success');
    } catch (error) {
      this.showMessage(errorMessage(error), 'error');
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }

  roleLabel(): string {
    return this.currentUser ? this.authService.roleLabel(this.currentUser.role) : '';
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
}
