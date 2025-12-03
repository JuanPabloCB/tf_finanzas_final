// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  usernameOrEmail: string;   // puede ser correo o username
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  username?: string;  // <-- AGREGAR si no está
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiBase = 'http://127.0.0.1:8000';
  private TOKEN_KEY = 'token';
  private USERNAME_KEY = 'username';

  constructor(private http: HttpClient) {}

  // 🔹 Registro de usuario
  register(data: RegisterPayload): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/api/registrar-usuario`, data);
  }

  // 🔹 Login
  login(data: LoginPayload): Observable<TokenResponse> {
    const body = new URLSearchParams();
    body.set('username', data.usernameOrEmail);
    body.set('password', data.password);

    return this.http.post<TokenResponse>(
      `${this.apiBase}/token`,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
  }

  // 🔹 Guardar token + username
  saveTokenAndUsername(token: string, username: string): void {
    this.setToken(token);
    this.setUsername(username);  // <-- GUARDAR USERNAME
  }

  // 🔹 Manejo de token en localStorage
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // 🔹 Manejo de username en localStorage
  setUsername(username: string): void {
    localStorage.setItem('username', username);
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  clearUsername(): void {
    localStorage.removeItem(this.USERNAME_KEY);
  }

  // ==========================================
  // OBTENER USERNAME DESDE EL TOKEN (por si lo necesitas)
  // ==========================================
  getUsernameFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;

      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(base64);
      const payload = JSON.parse(payloadJson);

      return payload.sub || null;
    } catch (e) {
      console.error('No se pudo decodificar el token:', e);
      return null;
    }
  }

  // ==========================================
  // HELPERS EXTRA
  // ==========================================
  saveToken(token: string): void {
    this.setToken(token);
  }

  removeToken(): void {
    this.clearToken();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    // Elimina token/usuario de storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    // opcional: eliminar otros items relacionados con sesión
    localStorage.removeItem('refresh_token');
  }
}
