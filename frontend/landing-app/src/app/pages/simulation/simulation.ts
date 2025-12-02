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
  private API_BASE = 'http://127.0.0.1:8000';

  // ===== Listados =====
  clientes: Cliente[] = [];
  inmuebles: Inmueble[] = [];

  // ===== Selecciones base =====
  selectedClienteId: number | null = null;
  selectedInmuebleId: number | null = null;

  // ===== Condiciones del crédito (sección 2) =====
  moneda: 'PEN' | 'USD' = 'PEN';          // moneda_prestamo
  banco: string = '';                     // solo informativo en front

  precioInmueble: number | null = null;   // precio_final_inmueble (parte editable)
  porcentajeInicial: number = 10;         // porcentaje_cuota_inicial (10, 15, 20)
  bonoBuenPagador: number = 0;            // monto_bono_buen_pagador

  plazoAnhos: number = 20;                // plazo_anios

  tipoTasa: TipoTasa = 'EFECTIVA';        // tipo_tasa
  valorTasa: number = 10;                 // valor_tasa  (en %)
  capitalizacionDias: number = 30;        // capitalizacion (solo si NOMINAL)

  // ===== Periodo de gracia (sección 3) =====
  tipoPeriodoGracia: TipoPeriodoGracia = 'Sin Gracia';   // tipo_periodo_gracia
  mesesGracia: number = 0;                                // meses_gracia

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
  ) {
    this.username = this.auth.getUsernameFromToken() ?? 'Usuario';
  }

  // ================== LIFECYCLE ==================
  ngOnInit(): void {
    this.cargarClientes();
    this.cargarInmuebles();
  }

  // ================== HELPERS ==================
  private buildAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.auth.getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  get selectedCliente(): Cliente | undefined {
    return this.clientes.find(c => c.id === this.selectedClienteId);
  }

  get selectedInmueble(): Inmueble | undefined {
    return this.inmuebles.find(i => i.id === this.selectedInmuebleId);
  }

  onInmuebleChange() {
    const inm = this.selectedInmueble;
    if (inm) {
      this.precioInmueble = inm.precio_venta;
      this.moneda = inm.moneda_venta as 'PEN' | 'USD';
    }
  }

  // ================== CARGA DE DATA ==================
  cargarClientes() {
    this.http.get<Cliente[]>(`${this.API_BASE}/api/clientes`, {
      headers: this.buildAuthHeaders(),
    }).subscribe({
      next: data => this.clientes = data || [],
      error: () => this.openModal('error', 'Error', 'No se pudieron cargar los clientes.')
    });
  }

  cargarInmuebles() {
    this.http.get<Inmueble[]>(`${this.API_BASE}/api/inmuebles`, {
      headers: this.buildAuthHeaders(),
    }).subscribe({
      next: data => this.inmuebles = data || [],
      error: () => this.openModal('error', 'Error', 'No se pudieron cargar las viviendas.')
    });
  }

  // ================== ACCIONES ==================
  onSimulate(form: NgForm) {
    if (form.invalid) {
      this.openModal('error', 'Datos incompletos', 'Completa todos los campos obligatorios.');
      return;
    }

    if (!this.selectedClienteId || !this.selectedInmuebleId) {
      this.openModal('error', 'Faltan selecciones', 'Debes elegir un cliente y una vivienda.');
      return;
    }

    if (this.precioInmueble === null || this.precioInmueble <= 0) {
      this.openModal('error', 'Precio inválido', 'El precio del inmueble debe ser mayor a cero.');
      return;
    }

    // ===== Armamos el payload EXACTO al CotizacionInput =====
    const payload = {
      cliente_id: this.selectedClienteId,
      inmueble_id: this.selectedInmuebleId,

      moneda_prestamo: this.moneda,
      precio_final_inmueble: Number(this.precioInmueble),

      porcentaje_cuota_inicial: Number(this.porcentajeInicial),
      monto_bono_buen_pagador: Number(this.bonoBuenPagador || 0),

      tipo_tasa: this.tipoTasa,                  // 'EFECTIVA' | 'NOMINAL'
      valor_tasa: Number(this.valorTasa),
      capitalizacion: this.tipoTasa === 'NOMINAL'
        ? Number(this.capitalizacionDias || 30)
        : 30,

      plazo_anios: Number(this.plazoAnhos),

      tipo_periodo_gracia: this.tipoPeriodoGracia,
      meses_gracia: Number(this.mesesGracia || 0),

      // Por ahora dejamos estos parámetros en 0
      seguro_desgravamen_porc: 0.0,
      seguro_riesgo_porc: 0.0,
      gastos_administrativos: 0.0,
    };

    const headers = this.buildAuthHeaders();

    this.http.post<CotizacionResponse>(`${this.API_BASE}/api/cotizar`, payload, { headers })
      .subscribe({
        next: (resp) => {
          // Guardamos resultados clave para mostrarlos en la UI
          this.montoFinanciado = Math.round(resp.monto_prestamo);
          this.cuotaMensual = Math.round(resp.cuota_mensual_referencial);
          this.tcea = resp.tcea;

          console.log('== COTIZACIÓN GENERADA ==', resp);

          this.openModal(
            'success',
            'Simulación generada',
            'La simulación se generó correctamente. Puedes revisar el resultado estimado.'
          );

          // Si luego tienes una pantalla de cronograma, aquí navegas:
          // this.router.navigate(['/cronograma', resp.id]);
        },
        error: (err) => {
          console.error('Error al generar cotización:', err);
          this.openModal(
            'error',
            'Error al simular',
            'Ocurrió un problema al generar la simulación. Intenta nuevamente.'
          );
        }
      });
  }

  // ================== MODAL & NAVEGACIÓN ==================
  openModal(type: 'success' | 'error', title: string, message: string) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onLogout() {
    this.auth.clearToken();
    this.router.navigate(['/login']);
  }
}
