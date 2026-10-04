import type { Plaza } from '@/features/monitor/types/plaza.types'
import type { Sensor } from '@/features/sensores/types/sensor.types'
import type { KPISGenerales, OcupacionPorSotano, ResumenSensoresKPI } from './types/dashboard.types'

/** Misma regla que la columna de batería de RFA04 (rojo por debajo de 20%). */
export const UMBRAL_BATERIA_BAJA = 20

function redondear1(valor: number): number {
  return Math.round(valor * 10) / 10
}

function contarPlazas(plazas: Plaza[]) {
  const conteo = { ocupadas: 0, libres: 0, reservadas: 0, fueraDeServicio: 0 }
  for (const p of plazas) {
    if (p.estado === 'OCUPADA') conteo.ocupadas++
    else if (p.estado === 'LIBRE') conteo.libres++
    else if (p.estado === 'RESERVADA') conteo.reservadas++
    else conteo.fueraDeServicio++
  }
  return conteo
}

/**
 * % de ocupación: plazas no disponibles (ocupadas + reservadas) sobre plazas
 * operativas (total - fuera de servicio). 0 si no hay plazas operativas.
 */
function porcentajeOcupacion(c: ReturnType<typeof contarPlazas>, total: number): number {
  const operativas = total - c.fueraDeServicio
  return operativas === 0 ? 0 : redondear1(((c.ocupadas + c.reservadas) / operativas) * 100)
}

export function calcularKPIs(plazas: Plaza[]): KPISGenerales {
  const c = contarPlazas(plazas)
  return {
    totalPlazas: plazas.length,
    ...c,
    porcentajeOcupacion: porcentajeOcupacion(c, plazas.length),
  }
}

export function calcularOcupacionSotanos(plazas: Plaza[]): OcupacionPorSotano[] {
  const sotanos = [...new Set(plazas.map((p) => p.sotano))].sort()
  return sotanos.map((sotano) => {
    const delSotano = plazas.filter((p) => p.sotano === sotano)
    const c = contarPlazas(delSotano)
    return {
      sotano,
      totalPlazas: delSotano.length,
      ocupadas: c.ocupadas,
      reservadas: c.reservadas,
      fueraDeServicio: c.fueraDeServicio,
      porcentaje: porcentajeOcupacion(c, delSotano.length),
    }
  })
}

export function calcularResumenSensores(sensores: Sensor[]): ResumenSensoresKPI {
  const activos = sensores.filter((s) => s.estado === 'ACTIVO').length
  const inactivos = sensores.filter((s) => s.estado === 'INACTIVO').length
  const sinSeñal = sensores.filter((s) => s.estado === 'SIN_SEÑAL').length
  return {
    total: sensores.length,
    activos,
    inactivos,
    sinSeñal,
    fueraDeServicio: inactivos + sinSeñal,
    alertasBateriaBaja: sensores.filter(
      (s) => s.bateria !== undefined && s.bateria < UMBRAL_BATERIA_BAJA,
    ).length,
  }
}
