// src/app/pages/dashboard/dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule],
})
export class DashboardComponent implements OnInit {
  // Nombre que se muestra en el header
  username: string = '';

  // Valores usados en el HTML
  avgRate = 0;        // tasa promedio
  totalClients = 0;   // número de clientes
  avgQuota = 0;       // cuota promedio

  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    // Leer nombre desde el AuthService (o localStorage)
    this.username = this.auth.getUsername() ?? 'Usuario';
  }

  ngOnInit(): void {
    // Verificar que esté logueado
    if (!this.auth.getToken()) {
      this.router.navigate(['/login']);
    }
  }

  // ====== HEADER ======
  onLogout(): void {
    // Limpia token y regresa al login
    this.auth.clearToken();
    this.router.navigate(['/login']);
  }

  // ====== BOTONES PRINCIPALES ======
  onNewSimulation(): void {
    this.router.navigate(['/simulaciones/crear']);
  }

  onRegisterClient(): void {
    this.router.navigate(['/clientes/registrar']);
  }

  onRegisterHouse(): void {
    this.router.navigate(['/viviendas/registrar']);
  }

  onViewHouses(): void {
    console.log('Ver viviendas (pendiente de implementar)');
  }

  onViewClients(): void {
    console.log('Ver clientes (pendiente de implementar)');
  }

  onViewPaymentPlans(): void {
    // 👉 Ahora sí navega al Plan de pagos
    this.router.navigate(['/plan-de-pagos']);
  }

  onViewReports(): void {
    console.log('Ver reportes (pendiente de implementar)');
  }

  onViewHistory(): void {
    console.log('Ver historial de simulaciones (pendiente de implementar)');
  }
}
