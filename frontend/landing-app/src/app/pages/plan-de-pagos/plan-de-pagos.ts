// src/app/pages/plan-de-pagos/plan-de-pagos.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-plan-de-pagos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './plan-de-pagos.html',
  styleUrl: './plan-de-pagos.css',
})
export class PlanDePagos implements OnInit {
  username: string = '';
  cronograma: PagoRow[] = [];
  mostrarTabla: boolean = false;

  // NUEVAS VARIABLES DE SUMA
  totalIntereses: number = 0;
  totalAmortizacion: number = 0;
  totalCuotas: number = 0;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.username = this.auth.getUsername() ?? 'Usuario';
  }

  ngOnInit(): void {
    const cronogramaJson = localStorage.getItem('cronograma_pagos');
    if (cronogramaJson) {
      try {
        this.cronograma = JSON.parse(cronogramaJson);
        this.mostrarTabla = true;

        // ======= CÁLCULOS AQUÍ, NO EN EL HTML =======
        this.totalIntereses = this.cronograma
          .reduce((sum, p) => sum + p.interes, 0);

        this.totalAmortizacion = this.cronograma
          .reduce((sum, p) => sum + p.amortizacion, 0);

        this.totalCuotas = this.cronograma
          .reduce((sum, p) => sum + p.cuota_total, 0);

      } catch (e) {
        console.error('Error al parsear cronograma:', e);
      }
    }
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
