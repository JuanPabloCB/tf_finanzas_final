// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';

// 👇 IMPORTA LOS MÓDULOS DE FORMULARIOS Y COMMON
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),

    // 👇 ESTO HACE QUE ngModel, ngForm, *ngIf, ngClass, number, etc.
    //    estén disponibles en TODA la app sin tocar cada componente
    importProvidersFrom(FormsModule, CommonModule),
  ],
};
