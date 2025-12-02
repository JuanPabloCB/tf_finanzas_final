import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanDePagos } from './plan-de-pagos';

describe('PlanDePagos', () => {
  let component: PlanDePagos;
  let fixture: ComponentFixture<PlanDePagos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanDePagos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanDePagos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
