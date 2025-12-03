// src/app/pages/client-register/client-register.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-client-register',
  standalone: true,
  templateUrl: './client-register.html',
  styleUrls: ['./client-register.css'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ClientRegisterComponent {

  username: string = 'Usuario';
  private API_BASE = 'http://127.0.0.1:8000';

  // ===== Modelo en el front =====
  private getEmptyClient() {
    return {
      dni: '',
      first_name: '',
      last_name_p: '',
      last_name_m: '',
      address: '',
      email: '',
      phone: '',
      monthly_income: null as number | null,
    };
  }

  client = this.getEmptyClient();

  // ===== Popup =====
  showModal = false;
  modalType: 'success' | 'error' = 'success';
  modalTitle = '';
  modalMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {
    // Leer nombre desde el token/localStorage
    this.username = this.auth.getUsername() ?? 'Usuario';
  }

  // ===== Enviar formulario =====
  onSubmit(form: NgForm) {

    if (form.invalid) {
      this.openModal('error', 'Datos incompletos', 'Completa todos los campos');
      return;
    }

    // Juntar apellidos para el esquema del backend
    const apellidos = `${this.client.last_name_p} ${this.client.last_name_m}`.trim();

    // Payload EXACTO que espera schemas.ClienteBase
    const payload = {
      dni: this.client.dni,
      nombres: this.client.first_name,
      apellidos: apellidos,                       // 👈 un solo campo
      email: this.client.email,
      telefono: this.client.phone,
      ingreso_mensual: this.client.monthly_income ?? 0,
      edad: 30,                                   // 👈 por ahora fijo (después lo puedes pedir en el formulario)
      calificacion_sentinel: 'Normal',
      direccion_actual: this.client.address,
    };

    console.log('Enviando POST /api/clientes con payload:', payload);

    // Cabecera Authorization: Bearer <token>
    let headers = new HttpHeaders();
    const token = this.auth.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post(`${this.API_BASE}/api/clientes`, payload, { headers })
      .subscribe({
        next: (resp) => {
          console.log('== CLIENTE REGISTRADO ==', resp);
          this.openModal('success', 'Cliente registrado', 'Registrado correctamente.');
          this.client = this.getEmptyClient();
          form.resetForm();
        },
        error: (err) => {
          console.error('Error al registrar cliente:', err);
          this.openModal('error', 'Error', 'No se pudo registrar.');
        }
      });
  }

  // ===== Botón "Borrar todo" =====
  clearForm() {
    this.client = this.getEmptyClient();
  }

  // ===== Navegación =====
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // ===== Popup =====
  openModal(type: 'success'|'error', t: string, m: string) {
    this.modalType = type;
    this.modalTitle = t;
    this.modalMessage = m;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // ===== Logout desde esta pantalla =====
  onLogout() {
    this.auth.clearToken();
    this.router.navigate(['/login']);
  }
}
