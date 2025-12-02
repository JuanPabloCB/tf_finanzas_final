// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',   // <-- usa tus archivos reales
  styleUrl: './app.css',       // <-- usa tus archivos reales
})
export class AppComponent {
  title = 'landing-app';
}
