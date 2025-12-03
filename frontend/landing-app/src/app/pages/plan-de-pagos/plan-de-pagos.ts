// src/app/pages/plan-de-pagos/plan-de-pagos.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface PagoRow {
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
  cronograma: PagoRow[];
}

@Component({
  selector: 'app-plan-de-pagos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './plan-de-pagos.html',
  styleUrl: './plan-de-pagos.css',
})
export class PlanDePagos implements OnInit {
  username: string = '';

  // Lista de simulaciones guardadas
  simulaciones: SimulacionGuardada[] = [];
  selectedSimId: string | null = null;

  // Cronograma actual
  cronograma: PagoRow[] = [];
  mostrarTabla: boolean = false;

  // Totales
  totalIntereses: number = 0;
  totalAmortizacion: number = 0;
  totalCuotas: number = 0;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.username = this.auth.getUsername() ?? 'Usuario';
  }

  get selectedSim(): SimulacionGuardada | undefined {
    return this.simulaciones.find(s => s.id === this.selectedSimId);
  }

  ngOnInit(): void {
    // 1. Cargar lista de simulaciones guardadas
    const simsJson = localStorage.getItem('simulaciones_guardadas');
    if (simsJson) {
      try {
        this.simulaciones = JSON.parse(simsJson);
      } catch (e) {
        console.error('Error al parsear simulaciones_guardadas:', e);
        this.simulaciones = [];
      }
    }

    // 2. Si hay simulaciones, seleccionar la última
    if (this.simulaciones.length > 0) {
      const ultima = this.simulaciones[this.simulaciones.length - 1];
      this.selectedSimId = ultima.id;
      this.applySimulation(ultima);
    } else {
      // 3. Compatibilidad: si no hay simulaciones guardadas,
      // intentar leer el cronograma único antiguo
      const cronogramaJson = localStorage.getItem('cronograma_pagos');
      if (cronogramaJson) {
        try {
          this.cronograma = JSON.parse(cronogramaJson);
          this.mostrarTabla = this.cronograma.length > 0;
          this.recalcularTotales();
        } catch (e) {
          console.error('Error al parsear cronograma_pagos:', e);
        }
      }
    }
  }

  private applySimulation(sim: SimulacionGuardada): void {
    this.cronograma = sim.cronograma || [];
    this.mostrarTabla = this.cronograma.length > 0;
    this.recalcularTotales();
  }

  onSimulationChange(): void {
    if (!this.selectedSimId) {
      this.cronograma = [];
      this.mostrarTabla = false;
      this.totalIntereses = this.totalAmortizacion = this.totalCuotas = 0;
      return;
    }

    const sim = this.simulaciones.find(s => s.id === this.selectedSimId);
    if (sim) {
      this.applySimulation(sim);
    }
  }

  private recalcularTotales(): void {
    this.totalIntereses = this.cronograma
      .reduce((sum, p) => sum + p.interes, 0);

    this.totalAmortizacion = this.cronograma
      .reduce((sum, p) => sum + p.amortizacion, 0);

    this.totalCuotas = this.cronograma
      .reduce((sum, p) => sum + p.cuota_total, 0);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Formato de moneda
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  }

  descargarCSV(): void {
    let csv = 'N°,Saldo Inicial,Interés,Amortización,Seguro Desgravamen,Seguro Riesgo,Gastos,Cuota Total,Saldo Final\n';
    
    this.cronograma.forEach((row) => {
      csv += `${row.n},${row.saldo_inicial},${row.interes},${row.amortizacion},${row.seguro_desgravamen},${row.seguro_riesgo},${row.gastos},${row.cuota_total},${row.saldo_final}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'cronograma_pagos.csv');
    link.click();
  }
}
