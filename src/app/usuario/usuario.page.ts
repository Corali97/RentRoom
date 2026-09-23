import { Component, OnInit } from '@angular/core';
import { AuthService, RentRoomUser, UserRole } from '../services/auth.service';

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.page.html',
  styleUrls: ['./usuario.page.scss'],
  standalone: false,
})
export class UsuarioPage implements OnInit {
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

  constructor(private authService: AuthService) {}

  ngOnInit() { this.loadSession(); }

  submitLogin() {
    this.message = '';
    if (!this.loginEmail.trim() || !this.loginPassword) {
      this.showMessage('Completa correo y contraseña.', 'error'); return;
    }
    if (!this.isValidEmail(this.loginEmail)) {
      this.showMessage('Ingresa un correo electrónico válido.', 'error'); return;
    }
    const result = this.authService.login(this.loginEmail, this.loginPassword);
    this.showMessage(result.message, result.ok ? 'success' : 'error');
    if (result.ok) { this.loginPassword = ''; this.loadSession(); }
  }

  submitRegister() {
    this.message = '';
    if (!this.fullName.trim() || !this.registerEmail.trim() || !this.registerPassword) {
      this.showMessage('Completa todos los campos.', 'error'); return;
    }
    if (!this.isValidEmail(this.registerEmail)) {
      this.showMessage('Ingresa un correo electrónico válido.', 'error'); return;
    }
    if (this.registerPassword.length < 6) {
      this.showMessage('La contraseña debe tener al menos 6 caracteres.', 'error'); return;
    }
    const result = this.authService.register(this.fullName, this.registerEmail, this.registerPassword, this.registerRole);
    this.showMessage(result.message, result.ok ? 'success' : 'error');
    if (result.ok) { this.registerPassword = ''; this.loadSession(); }
  }

  saveProfile() {
    if (!this.profileName.trim()) {
      this.showMessage('El nombre no puede quedar vacío.', 'error'); return;
    }
    const updated = this.authService.updateProfile(this.profileName);
    if (updated) {
      this.currentUser = updated;
      this.showMessage('Perfil actualizado correctamente.', 'success');
    } else {
      this.showMessage('No se pudo actualizar el perfil. Vuelve a iniciar sesión.', 'error');
    }
  }

  logout() {
    this.authService.logout();
    this.currentUser = null;
    this.profileName = '';
    this.message = '';
    this.authMode = 'login';
  }

  roleLabel(): string {
    return this.currentUser ? this.authService.roleLabel(this.currentUser.role) : '';
  }

  private loadSession() {
    this.currentUser = this.authService.getCurrentUser();
    this.profileName = this.currentUser?.fullName ?? '';
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
}
