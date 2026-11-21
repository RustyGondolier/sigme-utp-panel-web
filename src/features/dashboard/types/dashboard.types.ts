export interface KPISGenerales {
  totalPlazas: number
  ocupadas: number
  libres: number
  reservadas: number
  fueraDeServicio: number
  /** (ocupadas + reservadas) / plazas operativas, en % con 1 decimal. */
  porcentajeOcupacion: number
}

import type { EventoPlazaCambiada } from '@/features/monitor/types/plaza.types'
import type {
  AlertaSinSenalPayload,
  SensorActualizadoPayload,
} from '@/features/sensores/types/sensor.types'

export interface ResumenSensoresKPI {
  total: number
  activos: number
  inactivos: number
  sinSeñal: number
  /** Sensores que no están operando: inactivos + sin señal. */
  fueraDeServicio: number
  /** Sensores con batería por debajo del umbral. */
  alertasBateriaBaja: number
}

export type ModuloAlerta = 'MONITOR' | 'SENSORES' | 'RESERVAS'

export type NivelAlerta = 'CRITICO' | 'ADVERTENCIA' | 'INFO'

export interface AlertaDashboard {
  id: string
  modulo: ModuloAlerta
  titulo: string
  mensaje: string
  nivel: NivelAlerta
  /** ISO 8601. */
  timestamp: string
}

export interface OcupacionPorSotano {
  /** Ej: "Sótano 1". */
  sotano: string
  totalPlazas: number
  ocupadas: number
  reservadas: number
  fueraDeServicio: number
  /** Misma definición que `KPISGenerales.porcentajeOcupacion`, por sótano. */
  porcentaje: number
}

/** Evento de prueba que `simularEvento` entrega a los listeners del socket. */
export type EventoSimuladoDashboard =
  | { tipo: 'plaza:estado_cambiado'; payload: EventoPlazaCambiada }
  | { tipo: 'sensor:actualizado'; payload: SensorActualizadoPayload }
  | { tipo: 'sensor:alerta_sin_senal'; payload: AlertaSinSenalPayload }
