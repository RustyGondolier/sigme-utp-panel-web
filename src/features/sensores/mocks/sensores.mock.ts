import type { Sensor } from '../types/sensor.types'

/** Fecha ISO relativa a "ahora", para que las emisiones sean coherentes con el estado. */
function haceMinutos(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString()
}

export const MOCK_SENSORES: Sensor[] = [
  {
    id: 'sen-001',
    codigo: 'SNS-A01',
    plazaId: 'A-01',
    ubicacion: 'Sótano 1 - Zona A',
    estado: 'ACTIVO',
    ultimaEmision: haceMinutos(1),
    bateria: 92,
  },
  {
    id: 'sen-002',
    codigo: 'SNS-A02',
    plazaId: 'A-02',
    ubicacion: 'Sótano 1 - Zona A',
    estado: 'ACTIVO',
    ultimaEmision: haceMinutos(3),
    bateria: 67,
  },
  {
    id: 'sen-003',
    codigo: 'SNS-B05',
    plazaId: 'B-05',
    ubicacion: 'Sótano 1 - Zona B',
    estado: 'ACTIVO',
    ultimaEmision: haceMinutos(2),
    bateria: 18,
    observaciones: 'Batería baja, programar reemplazo.',
  },
  {
    id: 'sen-004',
    codigo: 'SNS-B06',
    plazaId: 'B-06',
    ubicacion: 'Sótano 1 - Zona B',
    estado: 'INACTIVO',
    ultimaEmision: haceMinutos(60 * 24 * 3),
    bateria: 55,
    observaciones: 'Desactivado por mantenimiento de la plaza.',
  },
  {
    id: 'sen-005',
    codigo: 'SNS-C10',
    plazaId: 'C-10',
    ubicacion: 'Sótano 2 - Zona C',
    estado: 'SIN_SEÑAL',
    ultimaEmision: haceMinutos(95),
    bateria: 8,
    observaciones: 'Sin reporte desde hace más de una hora.',
  },
  {
    id: 'sen-006',
    codigo: 'SNS-C11',
    plazaId: 'C-11',
    ubicacion: 'Sótano 2 - Zona C',
    estado: 'SIN_SEÑAL',
    ultimaEmision: haceMinutos(60 * 6),
  },
  {
    id: 'sen-007',
    codigo: 'SNS-D01',
    plazaId: 'D-01',
    ubicacion: 'Exterior - Zona D',
    estado: 'INACTIVO',
    ultimaEmision: null,
    observaciones: 'Recién instalado, pendiente de activación.',
  },
]
