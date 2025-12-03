// src/app/pages/login/login.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
  AuthService,
  LoginPayload,
  TokenResponse,
} from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';

  mensajeOk = '';
  mensajeError = '';
  loading = false;

  // ===== POPUP =====
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' = 'error';

  constructor(private auth: AuthService, private router: Router) {}

  private openModalError(message: string) {
    this.modalType = 'error';
    this.modalTitle = 'Error al iniciar sesión';
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  onSubmit() {
    this.mensajeOk = '';
    this.mensajeError = '';

    if (!this.email || !this.password) {
      const msg = 'Correo y contraseña son obligatorios.';
      this.mensajeError = msg;
      this.openModalError(msg);
      return;
    }

    this.loading = true;

    const payload: LoginPayload = {
      usernameOrEmail: this.email,
      password: this.password,
    };

    console.log('Enviando payload de login:', payload);

    this.auth.login(payload).subscribe({
      next: (res: TokenResponse) => {
        console.log('Respuesta de login:', res);
        this.loading = false;

        // ✅ Guardar token
        this.auth.setToken(res.access_token);

        // ✅ Guardar username (lo devuelve el backend)
        if (res.username) {
          this.auth.setUsername(res.username);
        }

        this.mensajeOk = 'Login exitoso. Redirigiendo al panel...';

        // Redirigir al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error en login:', err);
        this.loading = false;

        const msg =
          err.error?.detail ??
          'No se pude iniciar sesión. Verifica tu correo y contraseña.';
        this.mensajeError = msg;
        this.openModalError(msg);
      },
    });
  }
}
