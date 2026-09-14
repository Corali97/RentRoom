import { Component, OnInit } from '@angular/core';

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

  constructor() { }

  ngOnInit() {
  }

  submitLogin() {
    // El envío se conectará al servicio de autenticación.
  }

  submitRegister() {
    // El registro se conectará al servicio de usuarios.
  }

}
