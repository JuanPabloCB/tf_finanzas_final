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

// Estructura del cronograma que devuelve el backend
interface CronogramaPago {
  n: number;
  saldo_inicial: number;
  interes: number;
  amortizacion: number;
  seguro_desgravamen: number;
  seguro_riesgo: number;
  gastos: number;
  cuota_total: number;
  saldo_final: number;
}

// Lo que se guardará en localStorage como simulación
interface SimulacionGuardada {
  id: string;
  nombre: string;
  fecha: string;
  cliente: string;
  cliente_dni: string;
  inmueble: string;
  moneda: 'PEN' | 'USD';
  montoFinanciado: number | null;
  cuotaMensual: number | null;
  tcea: number | null;
  cronograma: CronogramaPago[];
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

  // ===== Popup de error/estado =====
  showModal = false;
  modalType: 'success' | 'error' = 'success';
  modalTitle = '';
  modalMessage = '';

  // ===== Popup para GUARDAR simulación =====
  showSaveModal = false;
  simName: string = '';
  private lastCronograma: CronogramaPago[] | null = null;

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
    const token = (this.auth as any).getToken
      ? (this.auth as any).getToken()
      : localStorage.getItem('access_token');
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

        // Guardar cronograma en memoria y en localStorage (última simulación)
        if (response.cronograma_json) {
          const cronograma: CronogramaPago[] = JSON.parse(response.cronograma_json);
          this.lastCronograma = cronograma;
          localStorage.setItem('cronograma_pagos', JSON.stringify(cronograma));
        }

        // Abrir popup para guardar simulación con nombre
        this.simName = this.buildDefaultSimulationName();
        this.showSaveModal = true;
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

  // ================== MODAL DE ERROR ==================
  private showErrorModal(title: string, message: string): void {
    this.modalType = 'error';
    this.modalTitle = title;
    this.modalMessage = message;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalType = 'success';
  }

  // ================== LÓGICA PARA GUARDAR SIMULACIONES ==================
  private buildDefaultSimulationName(): string {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-PE');
    const cliente = this.selectedCliente
      ? `${this.selectedCliente.nombres} ${this.selectedCliente.apellidos}`
      : 'Cliente';
    const inmueble = this.selectedInmueble
      ? this.selectedInmueble.codigo_proyecto
      : 'Inmueble';
    return `Simulación ${fecha} - ${cliente} - ${inmueble}`;
  }

  saveSimulation(): void {
    if (!this.lastCronograma) {
      // Por seguridad, si no hay cronograma no hacemos nada
      this.showSaveModal = false;
      return;
    }

    const nombreFinal = this.simName && this.simName.trim().length > 0
      ? this.simName.trim()
      : this.buildDefaultSimulationName();

    const simulacion: SimulacionGuardada = {
      id: Date.now().toString(),
      nombre: nombreFinal,
      fecha: new Date().toISOString(),
      cliente: this.selectedCliente
        ? `${this.selectedCliente.nombres} ${this.selectedCliente.apellidos}`
        : '',
      cliente_dni: this.selectedCliente?.dni ?? '',
      inmueble: this.selectedInmueble
        ? `${this.selectedInmueble.codigo_proyecto} - ${this.selectedInmueble.tipo}`
        : '',
      moneda: this.moneda,
      montoFinanciado: this.montoFinanciado,
      cuotaMensual: this.cuotaMensual,
      tcea: this.tcea,
      cronograma: this.lastCronograma
    };

    const existingJson = localStorage.getItem('simulaciones_guardadas');
    const lista: SimulacionGuardada[] = existingJson ? JSON.parse(existingJson) : [];

    lista.push(simulacion);
    localStorage.setItem('simulaciones_guardadas', JSON.stringify(lista));

    this.showSaveModal = false;

    // Ir directo al plan de pagos para ver el resultado
    this.router.navigate(['/plan-de-pagos']);
  }

  cancelSaveSimulation(): void {
    this.showSaveModal = false;
    // Aun así dejamos el cronograma_pagos para verlo si el usuario quiere
    // pero no se agrega a la lista de simulaciones guardadas.
  }
}
