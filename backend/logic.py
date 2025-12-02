import numpy_financial as npf
import json
from schemas import CotizacionInput # <--- Nota que ahora importamos el esquema correcto

def calcular_cotizacion(datos: CotizacionInput):
    """
    Calcula el cronograma de pagos del Crédito MiVivienda (Método Francés)
    considerando Bonos del Estado y Periodos de Gracia.
    """
    
    # 1. CÁLCULOS INICIALES DEL PRÉSTAMO
    # ----------------------------------
    
    # Monto de la Cuota Inicial
    monto_inicial = datos.precio_final_inmueble * (datos.porcentaje_cuota_inicial / 100.0)
    
    # Monto a Financiar (El Préstamo)
    # FÓRMULA MIVIVIENDA: Precio - Inicial - Bono del Buen Pagador (BBP)
    monto_prestamo = datos.precio_final_inmueble - monto_inicial - datos.monto_bono_buen_pagador
    
    # Conversión de Tasa a Efectiva Mensual (TEM)
    tasa_decimal = datos.valor_tasa / 100.0
    tem = 0.0
    
    if datos.tipo_tasa == "Nominal":
        # TNA a TEM: (1 + TNA/m)^(n) - 1
        # Asumiendo TNA con capitalización diaria (lo más común en bancos):
        # m = 360 / datos.capitalizacion
        # tem = ((1 + (tasa_decimal / m)) ** (30 / datos.capitalizacion)) - 1
        
        # Corrección común: Si capitalización es 30 (mensual) -> TNA/12
        if datos.capitalizacion > 0:
             m = 360 / datos.capitalizacion
             tem = ((1 + (tasa_decimal / m)) ** (30 / datos.capitalizacion)) - 1
        else:
             # Default o error handling
             tem = ((1 + tasa_decimal) ** (30 / 360)) - 1
             
    else:
        # TEA a TEM: (1 + TEA)^(30/360) - 1
        tem = ((1 + tasa_decimal) ** (30 / 360)) - 1

    # Total de cuotas (meses)
    total_cuotas = datos.plazo_anios * 12
    
    # 2. GENERACIÓN DEL CRONOGRAMA
    # ----------------------------
    cronograma = []
    flujo_caja = [monto_prestamo] # Para el cálculo de la TCEA (VAN/TIR)
    
    saldo_capital = monto_prestamo
    cuota_mensual_referencial = 0.0
    
    for n in range(1, total_cuotas + 1):
        # A. Cálculo de Seguros y Gastos (Se pagan siempre)
        seguro_desgravamen = saldo_capital * (datos.seguro_desgravamen_porc / 100.0)
        seguro_riesgo = datos.precio_final_inmueble * (datos.seguro_riesgo_porc / 12 / 100.0) # Anual a mensual
        gastos = datos.gastos_administrativos
        
        # B. Cálculo de Interés del Periodo
        interes = saldo_capital * tem
        
        amortizacion = 0.0
        cuota_financiera = 0.0
        
        # C. Lógica de Periodos de Gracia
        if n <= datos.meses_gracia:
            # ESTAMOS EN PERIODO DE GRACIA
            if datos.tipo_periodo_gracia == "Total":
                # Gracia Total: No se paga interés ni capital. El interés se suma a la deuda.
                amortizacion = 0.0
                cuota_financiera = 0.0 
                saldo_capital += interes # Capitalización de intereses
            elif datos.tipo_periodo_gracia == "Parcial":
                # Gracia Parcial: Se paga el interés, pero no se amortiza capital.
                amortizacion = 0.0
                cuota_financiera = interes 
        else:
            # PERIODO NORMAL (Método Francés)
            # Recalculamos la cuota fija con el saldo actual y los meses restantes
            meses_restantes = total_cuotas - n + 1
            
            # Fórmula Renta (R) = P * [i(1+i)^n] / [(1+i)^n - 1]
            if saldo_capital > 0:
                factor = (tem * ((1 + tem) ** meses_restantes)) / (((1 + tem) ** meses_restantes) - 1)
                cuota_financiera = saldo_capital * factor
                amortizacion = cuota_financiera - interes
            else:
                cuota_financiera = 0
                amortizacion = 0
            
            # Guardamos la primera cuota "normal" como referencia
            if cuota_mensual_referencial == 0:
                cuota_mensual_referencial = cuota_financiera + seguro_desgravamen + seguro_riesgo + gastos

        # D. Cuota Total a Pagar (Cliente)
        # En Gracia Total, asumimos que seguros se pagan (depende del banco, pero es estándar)
        cuota_total = cuota_financiera + seguro_desgravamen + seguro_riesgo + gastos
        
        # E. Actualizar Saldo 
        if datos.tipo_periodo_gracia != "Total" or n > datos.meses_gracia:
            saldo_capital -= amortizacion
            # Ajuste final por redondeo
            if n == total_cuotas and abs(saldo_capital) < 10:
                cuota_total += saldo_capital
                amortizacion += saldo_capital
                saldo_capital = 0.0
        
        # Corrección de saldo negativo pequeño por decimales
        if saldo_capital < 0: saldo_capital = 0

        # Guardar datos
        cronograma.append({
            "n": n,
            "saldo_inicial": round(saldo_capital + amortizacion if (datos.tipo_periodo_gracia != "Total" or n > datos.meses_gracia) else saldo_capital - interes, 2),
            "interes": round(interes, 2),
            "amortizacion": round(amortizacion, 2),
            "seguro_desgravamen": round(seguro_desgravamen, 2),
            "seguro_riesgo": round(seguro_riesgo, 2),
            "gastos": round(gastos, 2),
            "cuota_total": round(cuota_total, 2),
            "saldo_final": round(saldo_capital, 2)
        })
        
        flujo_caja.append(-cuota_total)

    # 3. CÁLCULO DE INDICADORES (TCEA, VAN)
    # -------------------------------------
    
    try:
        tir_mensual = npf.irr(flujo_caja)
        tcea = ((1 + tir_mensual) ** 12) - 1
    except:
        tcea = 0.0
        tir_mensual = 0.0

    van = npf.npv(tem, flujo_caja)

    return {
        "monto_prestamo": round(monto_prestamo, 2),
        "cuota_mensual_referencial": round(cuota_mensual_referencial, 2),
        "tcea": round(tcea * 100, 7),
        "van": round(van, 2),
        "tir": round(tir_mensual * 100, 7),
        "cronograma": cronograma 
    }