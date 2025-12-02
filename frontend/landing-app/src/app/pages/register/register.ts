// src/app/pages/register/register.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';
  password2: string = '';

  mensajeOk: string = '';
  mensajeError: string = '';

  // 👇 este es el que usas en el HTML: [disabled]="isSubmitting"
  isSubmitting: boolean = false;

  // Popup (si luego quieres usarlo)
  showModal: boolean = false;
  modalType: 'success' | 'error' = 'success';
  modalTitle: string = '';
  modalMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ============================================================
  // SUBMIT DEL FORMULARIO
  // ============================================================
  onSubmit(): void {
    if (this.isSubmitting) return;

    // Validaciones básicas
    if (!this.name || !this.email || !this.password || !this.password2) {
      this.openModal(
        'error',
        'Campos incompletos',
        'Completa todos los campos'
      );
      return;
    }

    if (this.password !== this.password2) {
      this.openModal(
        'error',
        'Error',
        'Las contraseñas no coinciden'
      );
      return;
    }

    this.isSubmitting = true;

    const payload = {
      username: this.name,
      email: this.email,
      password: this.password,
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        console.log('Registro OK:', res);

        this.isSubmitting = false;
        this.mensajeError = '';
        this.mensajeOk = 'Usuario registrado correctamente';

        // 👉 OPCIÓN 1: redirigir directo al login
        this.router.navigate(['/login']);

        // 👉 Si prefieres mostrar el popup ANTES de ir al login:
        // this.openModal(
        //   'success',
        //   'Registro exitoso',
        //   'Tu cuenta fue creada correctamente'
        // );
      },
      error: (err) => {
        console.error('Error en registro:', err);
        this.isSubmitting = false;
        this.mensajeOk = '';
        this.mensajeError = err.error?.detail ?? 'No se pudo registrar';

        this.openModal(
          'error',
          'Error',
          this.mensajeError
        );
      },
    });
  }

  // ============================================================
  // POPUP (lo dejamos por si luego lo quieres usar)
  // ============================================================
  openModal(
    type: 'success' | 'error',
    title: string,
    message: string
  ): void {
    this.modalType = type;
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;

    // Si en algún momento decides navegar DESDE el popup:
    if (this.modalType === 'success') {
      this.router.navigate(['/login']);
    }
  }
}
