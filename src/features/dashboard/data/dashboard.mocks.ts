import type { AlertaDashboard } from '../types/dashboard.types'

/** Fecha ISO relativa a "ahora", para que las alertas se vean recientes. */
function haceMinutos(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString()
}

/**
 * Alertas de ejemplo, de la más reciente a la más antigua. Los textos están
 * alineados con MOCK_PLAZAS y MOCK_SENSORES (SNS-C10 sin señal, SNS-B05 con
 * 18% de batería, Sótano 1 en 71.4%); si esos mocks cambian, revisar aquí.
 */
export const MOCK_ALERTAS_DASHBOARD: AlertaDashboard[] = [
  {
    id: 'alt-001',
    modulo: 'RESERVAS',
    titulo: 'Reservas pendientes de ingreso',
    mensaje: 'Las plazas A-03 y B-08 tienen reservas activas sin ingreso registrado.',
    nivel: 'INFO',
    timestamp: haceMinutos(8),
  },
  {
    id: 'alt-002',
    modulo: 'MONITOR',
    titulo: 'Ocupación alta en Sótano 1',
    mensaje: 'El Sótano 1 está al 71.4% de ocupación (5 de 7 plazas operativas).',
    nivel: 'ADVERTENCIA',
    timestamp: haceMinutos(15),
  },
  {
    id: 'alt-003',
    modulo: 'SENSORES',
    titulo: 'Sensor sin señal',
    mensaje: 'SNS-C10 (plaza C-10) no reporta desde hace más de una hora.',
    nivel: 'CRITICO',
    timestamp: haceMinutos(30),
  },
  {
    id: 'alt-004',
    modulo: 'SENSORES',
    titulo: 'Batería baja',
    mensaje: 'SNS-B05 (plaza B-05) tiene 18% de batería. Programar reemplazo.',
    nivel: 'ADVERTENCIA',
    timestamp: haceMinutos(50),
  },
  {
    id: 'alt-005',
    modulo: 'SENSORES',
    titulo: 'Sensor sin señal',
    mensaje: 'SNS-C11 (plaza C-11) lleva varias horas sin reportar.',
    nivel: 'CRITICO',
    timestamp: haceMinutos(120),
  },
  {
    id: 'alt-006',
    modulo: 'MONITOR',
    titulo: 'Plaza fuera de servicio',
    mensaje: 'La plaza B-06 sigue fuera de servicio por mantenimiento.',
    nivel: 'INFO',
    timestamp: haceMinutos(240),
  },
]
