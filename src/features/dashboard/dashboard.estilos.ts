export type TonoKPI = 'exito' | 'alerta' | 'critico' | 'neutro'

export const CLASES_TONO: Record<TonoKPI, { icono: string; indicador: string; barra: string }> = {
  exito: {
    icono: 'bg-emerald-50 text-emerald-600',
    indicador: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    barra: 'bg-emerald-500',
  },
  alerta: {
    icono: 'bg-amber-50 text-amber-600',
    indicador: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    barra: 'bg-amber-500',
  },
  critico: {
    icono: 'bg-rose-50 text-rose-600',
    indicador: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    barra: 'bg-rose-500',
  },
  neutro: {
    icono: 'bg-slate-100 text-slate-600',
    indicador: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    barra: 'bg-slate-500',
  },
}

export const UMBRAL_OCUPACION_ALTA = 70
export const UMBRAL_OCUPACION_CRITICA = 90

/** Color según qué tan llena está la capacidad. */
export function tonoPorOcupacion(porcentaje: number): TonoKPI {
  if (porcentaje >= UMBRAL_OCUPACION_CRITICA) return 'critico'
  if (porcentaje >= UMBRAL_OCUPACION_ALTA) return 'alerta'
  return 'exito'
}
