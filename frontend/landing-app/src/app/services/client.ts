// src/app/services/client.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// === Lo que espera el backend (schemas.ClienteCreate) ===
export interface ClientRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  ingreso_mensual: number;
  edad: number;
  calificacion_sentinel: string; // "Normal", "CPP", etc.
  direccion_actual: string;
}

export interface ClienteResponse extends ClientRequest {
  id: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClientService {
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

  // Crear cliente (POST /api/clientes)
  createClient(payload: ClientRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(
      `${this.baseUrl}/clientes`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  // Listar clientes (GET /api/clientes)
  listClients(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(
      `${this.baseUrl}/clientes`,
      { headers: this.getAuthHeaders() }
    );
  }
}
