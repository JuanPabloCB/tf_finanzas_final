// src/app/services/simulation.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// === Lo que espera el backend (schemas.CotizacionInput) ===
export interface SimulationRequest {
  cliente_id: number;
  inmueble_id: number;

  moneda_prestamo: string;          // "PEN" o "USD"
  precio_final_inmueble: number;

  porcentaje_cuota_inicial: number; // ej: 10.0
  monto_bono_buen_pagador: number;  // 0 si no hay

  tipo_tasa: string;                // "Nominal" o "Efectiva"
  valor_tasa: number;               // ej: 9.5
  capitalizacion: number;           // ej: 30

  plazo_anios: number;              // ej: 20

  tipo_periodo_gracia: string;      // "Sin Gracia", "Parcial", "Total"
  meses_gracia: number;             // 0 si no hay gracia

  seguro_desgravamen_porc: number;  // % mensual
  seguro_riesgo_porc: number;       // % anual
  gastos_administrativos: number;   // monto fijo mensual
}

// === Lo que responde el backend (CotizacionResponse) ===
export interface SimulationResponse {
  id: number;
  fecha_cotizacion: string;
  monto_prestamo: number;
  cuota_mensual_referencial: number;
  tcea: number;
  van: number;
  tir: number;
  cronograma_json: string; // luego lo parseas con JSON.parse(...)
}

@Injectable({
  providedIn: 'root',
})
export class SimulationService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  // Ejecutar simulación (POST /api/cotizar)
  simulate(payload: SimulationRequest): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(
      `${this.baseUrl}/cotizar`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }
}
