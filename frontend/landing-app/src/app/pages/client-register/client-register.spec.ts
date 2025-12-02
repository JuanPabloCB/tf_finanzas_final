// src/app/pages/client-register/client-register.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientRegisterComponent } from './client-register';

describe('ClientRegisterComponent', () => {
  let component: ClientRegisterComponent;
  let fixture: ComponentFixture<ClientRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Como es standalone, va en imports:
      imports: [ClientRegisterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
