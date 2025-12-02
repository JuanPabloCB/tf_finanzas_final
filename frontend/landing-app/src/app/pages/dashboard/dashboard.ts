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
  username: string = 'Usuario';

  // Valores usados en el HTML
  avgRate = 0;        // tasa promedio
  totalClients = 0;   // número de clientes
  avgQuota = 0;       // cuota promedio

  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    const stored = this.auth.getUsername();
    this.username = stored ?? 'Usuario';
  }

  ngOnInit(): void {
    const name = this.auth.getUsernameFromToken();
    this.username = name ?? 'Usuario';
  }

  // ====== HEADER ======
  onLogout() {
    // Limpia token y regresa al login
    this.auth.clearToken();
    this.router.navigate(['/login']);
  }

  // ====== BOTONES PRINCIPALES ======
  onNewSimulation() {
    this.router.navigate(['/simulaciones/crear']);
  }

  onRegisterClient() {
    this.router.navigate(['/clientes/registrar']);
  }

  onRegisterHouse() {
    this.router.navigate(['/viviendas/registrar']);
  }

  onViewHouses() {
    console.log('Ver viviendas (pendiente de implementar)');
  }

  onViewClients() {
    console.log('Ver clientes (pendiente de implementar)');
  }

  onViewPaymentPlans() {
    console.log('Ver planes de pago (pendiente de implementar)');
  }

  onViewReports() {
    console.log('Ver reportes (pendiente de implementar)');
  }

  onViewHistory() {
    console.log('Ver historial de simulaciones (pendiente de implementar)');
  }
}
