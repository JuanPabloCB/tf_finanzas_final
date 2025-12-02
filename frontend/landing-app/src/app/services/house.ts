// src/app/services/house.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// === Lo que espera el backend (schemas.InmuebleCreate) ===
export interface HouseRequest {
  codigo_proyecto: string;  // Ej: "RES-MIR-01"
  direccion: string;        // Dirección exacta
  tipo: string;             // Departamento, Casa, Loft, etc.
  area_m2: number;          // Área total en m²
  precio_venta: number;     // Precio de lista
  moneda_venta: string;     // "PEN" o "USD"
}

export interface InmuebleResponse extends HouseRequest {
  id: number;
  estado: string;           // "Disponible", "Vendido", etc.
}

@Injectable({
  providedIn: 'root',
})
export class HouseService {
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

  // Crear inmueble (POST /api/inmuebles)
  createHouse(payload: HouseRequest): Observable<InmuebleResponse> {
    return this.http.post<InmuebleResponse>(
      `${this.baseUrl}/inmuebles`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  // Listar inmuebles (GET /api/inmuebles)
  listHouses(): Observable<InmuebleResponse[]> {
    return this.http.get<InmuebleResponse[]>(
      `${this.baseUrl}/inmuebles`,
      { headers: this.getAuthHeaders() }
    );
  }
}
