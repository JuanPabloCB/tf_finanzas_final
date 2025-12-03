// src/app/pages/simulation/simulation.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// ====== Interfaces alineadas al backend ======
interface Cliente {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  ingreso_mensual: number;
}

interface Inmueble {
  id: number;
  codigo_proyecto: string;
  direccion: string;
  tipo: string;
  area_m2: number;
  precio_venta: number;
  moneda_venta: string;
}

// Respuesta de /api/cotizar
interface CotizacionResponse {
  id: number;
  fecha_cotizacion: string;
  monto_prestamo: number;
  cuota_mensual_referencial: number;
  tcea: number;
  van: number;
  tir: number;
  cronograma_json: string;
}

type TipoTasa = 'EFECTIVA' | 'NOMINAL';
type TipoPeriodoGracia = 'Sin Gracia' | 'Parcial' | 'Total';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulation.html',
  styleUrls: ['./simulation.css'],
})
export class SimulationComponent implements OnInit {

  username: string = 'Usuario';
  private apiUrl = 'http://localhost:8000/api';

  // ===== Listados =====
  clientes: Cliente[] = [];
  inmuebles: Inmueble[] = [];

  // ===== Selecciones base =====
  selectedClienteId: number | null = null;
  selectedInmuebleId: number | null = null;

  // ===== Getters para mostrar cliente e inmueble seleccionados =====
  get selectedCliente(): Cliente | undefined {
    return this.clientes.find(c => c.id === this.selectedClienteId);
  }

  get selectedInmueble(): Inmueble | undefined {
    return this.inmuebles.find(i => i.id === this.selectedInmuebleId);
  }

  // ===== Condiciones del crédito (sección 3) =====
  moneda: 'PEN' | 'USD' = 'PEN';
  banco: string = '';
  precioInmueble: number | null = null;
  porcentajeInicial: number = 10;
  bonoBuenPagador: number = 0;
  plazoAnhos: number = 20;
  tipoTasa: TipoTasa = 'EFECTIVA';
  valorTasa: number = 10;
  capitalizacionDias: number = 30;

  // ===== Periodo de gracia (sección 2) =====
  tipoPeriodoGracia: TipoPeriodoGracia = 'Sin Gracia';
  mesesGracia: number = 0;

  // ===== Resultados devueltos por el backend =====
  montoFinanciado: number | null = null;
  cuotaMensual: number | null = null;
  tcea: number | null = null;

  // ===== Popups =====
  showModal = false;
  modalType: 'success' | 'error' = 'success';
  modalTitle = '';
  modalMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  // ================== LIFECYCLE ==================
  ngOnInit(): void {
    this.loadUsername();
    this.loadClientes();
    this.loadInmuebles();
  }

  // ================== CARGAR DATOS INICIALES ==================
  private loadUsername(): void {
    this.username = this.auth.getUsername() || 'Usuario';
  }

  // ================== AUTENTICACIÓN EN CABECERAS ==================
  private getAuthHeaders(): HttpHeaders {
    // intenta obtener token desde el servicio si tiene método, si no desde localStorage
    // (ajusta si tu AuthService tiene otro getter)
    const token = (this.auth as any).getToken ? (this.auth as any).getToken() : localStorage.getItem('access_token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private loadClientes(): void {
    this.http.get<Cliente[]>(`${this.apiUrl}/clientes`, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.clientes = data;
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        if (err.status === 401) {
          this.showErrorModal('No autenticado', 'Por favor inicia sesión para cargar los clientes');
        } else {
          this.showErrorModal('Error', 'No se pudieron cargar los clientes');
        }
      }
    });
  }

  private loadInmuebles(): void {
    this.http.get<Inmueble[]>(`${this.apiUrl}/inmuebles`, { headers: this.getAuthHeaders() }).subscribe({
      next: (data) => {
        this.inmuebles = data;
      },
      error: (err) => {
        console.error('Error cargando inmuebles:', err);
        if (err.status === 401) {
          this.showErrorModal('No autenticado', 'Por favor inicia sesión para cargar los inmuebles');
        } else {
          this.showErrorModal('Error', 'No se pudieron cargar los inmuebles');
        }
      }
    });
  }

  // ================== EVENTOS ==================
  onInmuebleChange(): void {
    if (this.selectedInmueble) {
      this.precioInmueble = this.selectedInmueble.precio_venta;
      this.moneda = this.selectedInmueble.moneda_venta as 'PEN' | 'USD';
    }
  }

  onSimulate(form: NgForm): void {
    // Validar formulario
    if (!form.valid) {
      this.showErrorModal('Validación', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (!this.selectedClienteId || !this.selectedInmuebleId || !this.precioInmueble) {
      this.showErrorModal('Validación', 'Debes seleccionar cliente e inmueble');
      return;
    }

    // Preparar datos para el backend
    const datosSimulacion = {
      cliente_id: this.selectedClienteId,
      inmueble_id: this.selectedInmuebleId,
      moneda_prestamo: this.moneda,
      precio_final_inmueble: this.precioInmueble,
      porcentaje_cuota_inicial: this.porcentajeInicial,
      monto_bono_buen_pagador: this.bonoBuenPagador,
      tipo_tasa: this.tipoTasa,
      valor_tasa: this.valorTasa,
      capitalizacion: this.capitalizacionDias,
      plazo_anios: this.plazoAnhos,
      tipo_periodo_gracia: this.tipoPeriodoGracia,
      meses_gracia: this.mesesGracia,
      seguro_desgravamen_porc: 0,
      seguro_riesgo_porc: 0,
      gastos_administrativos: 0
    };

    // Enviar al backend con headers de auth
    this.http.post<CotizacionResponse>(
      `${this.apiUrl}/cotizar`,
      datosSimulacion,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (response) => {
        // Mostrar resultados
        this.montoFinanciado = response.monto_prestamo;
        this.cuotaMensual = response.cuota_mensual_referencial;
        this.tcea = response.tcea;

        // ✅ Guardar cronograma en localStorage
        if (response.cronograma_json) {
          const cronograma = JSON.parse(response.cronograma_json);
          localStorage.setItem('cronograma_pagos', JSON.stringify(cronograma));
        }

        this.showSuccessModal('Éxito', 'Simulación generada correctamente');
      },
      error: (err) => {
        console.error('Error en simulación:', err);
        if (err.status === 401) {
          this.showErrorModal('No autenticado', 'Por favor inicia sesión antes de generar la simulación');
        } else {
          this.showErrorModal('Error', err.error?.detail || 'Error al generar la simulación');
        }
      }
    });
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ================== MODAL HELPERS ==================
  private showSuccessModal(title: string, message: string): void {
    this.modalType = 'success';
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  private showErrorModal(title: string, message: string): void {
    this.modalType = 'error';
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }


  closeModal(): void {
    this.showModal = false;

    // Si el modal que se cerró era de éxito, vamos al plan de pagos
    if (this.modalType === 'success') {
      this.router.navigate(['/plan-de-pagos']);
    }

    // (opcional) limpiar tipo para futuros modales
    this.modalType = 'success';
  }

}
