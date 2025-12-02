// src/app/pages/simulation/simulation.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimulationComponent } from './simulation';

describe('SimulationComponent', () => {
  let component: SimulationComponent;
  let fixture: ComponentFixture<SimulationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationComponent], // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(SimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
