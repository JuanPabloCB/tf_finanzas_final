// src/app/pages/house-register/house-register.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-house-register',
  standalone: true,
  templateUrl: './house-register.html',
  styleUrls: ['./house-register.css'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class HouseRegisterComponent {
  username: string = 'Usuario';
  private API_BASE = 'http://127.0.0.1:8000';

  // Solo los campos que realmente usa el backend
  private getEmptyHouse() {
    return {
      codigo_proyecto: '',
      direccion: '',
      tipo: '',
      area_m2: null as number | null,
      precio_venta: null as number | null,
      moneda_venta: 'PEN',
    };
  }

  house = this.getEmptyHouse();

  showModal = false;
  modalType: 'success' | 'error' = 'success';
  modalTitle = '';
  modalMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {
    this.username = this.auth.getUsernameFromToken() ?? 'Usuario';
  }

  // ===== Guardar vivienda =====
  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.openModal(
        'error',
        'Datos incompletos',
        'Por favor completa todos los campos obligatorios.'
      );
      return;
    }

    // Armamos el payload EXACTO que espera el backend
    const payload = {
      codigo_proyecto: this.house.codigo_proyecto,
      direccion: this.house.direccion,
      tipo: this.house.tipo,
      area_m2: Number(this.house.area_m2),
      precio_venta: Number(this.house.precio_venta),
      moneda_venta: this.house.moneda_venta,
    };

    let headers = new HttpHeaders();
    const token = this.auth.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    console.log('Enviando POST /api/inmuebles con payload:', payload);

    this.http
      .post(`${this.API_BASE}/api/inmuebles`, payload, { headers })
      .subscribe({
        next: (resp) => {
          console.log('== INMUEBLE REGISTRADO ==', resp);
          this.openModal(
            'success',
            'Vivienda registrada',
            'La vivienda se registró correctamente.'
          );
          this.house = this.getEmptyHouse();
          form.resetForm();
        },
        error: (err) => {
          console.error('Error al registrar inmueble:', err);
          this.openModal(
            'error',
            'Error al registrar',
            'Ocurrió un problema al registrar la vivienda. Intenta nuevamente.'
          );
        },
      });
  }

  // ===== Botón "Borrar todo" =====
  clearForm() {
    this.house = this.getEmptyHouse();
  }

  // ===== Navegación =====
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // ===== Popup =====
  openModal(type: 'success' | 'error', title: string, message: string) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // ===== Logout =====
  onLogout() {
    this.auth.clearToken();
    this.auth.clearUsername();
    this.router.navigate(['/login']);
  }
}
