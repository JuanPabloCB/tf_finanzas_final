// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ClientRegisterComponent } from './pages/client-register/client-register';
import { HouseRegisterComponent } from './pages/house-register/house-register';
import { SimulationComponent } from './pages/simulation/simulation';
import { PlanDePagos } from './pages/plan-de-pagos/plan-de-pagos';   // 👈 NUEVO

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'dashboard', component: DashboardComponent },

  { path: 'clientes/registrar', component: ClientRegisterComponent },
  { path: 'viviendas/registrar', component: HouseRegisterComponent },

  { path: 'simulaciones/crear', component: SimulationComponent },

  // 👇 ESTA ES LA RUTA QUE FALTABA
  { path: 'plan-de-pagos', component: PlanDePagos },

  { path: '**', redirectTo: 'login' },
];
