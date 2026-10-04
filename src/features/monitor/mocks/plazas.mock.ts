import type { Plaza } from '../types/plaza.types'

/** Fecha ISO relativa a "ahora", para que los tiempos transcurridos sean coherentes. */
function haceMinutos(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString()
}

export const MOCK_PLAZAS: Plaza[] = [
  // Sótano 1 - Zona A
  {
    id: 'plz-001',
    codigo: 'A-01',
    sotano: 'Sótano 1',
    zona: 'Zona A',
    estado: 'OCUPADA',
    sensorCodigo: 'SNS-A01',
    ocupante: { placa: 'ABC-123', usuario: 'Carlos Mendoza', horaIngreso: haceMinutos(95) },
  },
  {
    id: 'plz-002',
    codigo: 'A-02',
    sotano: 'Sótano 1',
    zona: 'Zona A',
    estado: 'LIBRE',
    sensorCodigo: 'SNS-A02',
  },
  {
    id: 'plz-003',
    codigo: 'A-03',
    sotano: 'Sótano 1',
    zona: 'Zona A',
    estado: 'RESERVADA',
    sensorCodigo: 'SNS-A03',
    ocupante: { placa: 'XYZ-456', usuario: 'María Quispe', horaIngreso: haceMinutos(10) },
  },
  {
    id: 'plz-004',
    codigo: 'A-04',
    sotano: 'Sótano 1',
    zona: 'Zona A',
    estado: 'OCUPADA',
    sensorCodigo: 'SNS-A04',
    ocupante: { placa: 'DEF-789', usuario: 'Luis Paredes', horaIngreso: haceMinutos(240) },
  },

  // Sótano 1 - Zona B
  {
    id: 'plz-005',
    codigo: 'B-05',
    sotano: 'Sótano 1',
    zona: 'Zona B',
    estado: 'OCUPADA',
    sensorCodigo: 'SNS-B05',
    ocupante: { placa: 'GHI-321', usuario: 'Ana Torres', horaIngreso: haceMinutos(30) },
  },
  {
    id: 'plz-006',
    codigo: 'B-06',
    sotano: 'Sótano 1',
    zona: 'Zona B',
    estado: 'FUERA_DE_SERVICIO',
    sensorCodigo: 'SNS-B06',
  },
  {
    id: 'plz-007',
    codigo: 'B-07',
    sotano: 'Sótano 1',
    zona: 'Zona B',
    estado: 'LIBRE',
    sensorCodigo: 'SNS-B07',
  },
  {
    id: 'plz-008',
    codigo: 'B-08',
    sotano: 'Sótano 1',
    zona: 'Zona B',
    estado: 'RESERVADA',
    sensorCodigo: 'SNS-B08',
    ocupante: { placa: 'JKL-654', usuario: 'Diego Salazar', horaIngreso: haceMinutos(4) },
  },

  // Sótano 2 - Zona C
  {
    id: 'plz-009',
    codigo: 'C-09',
    sotano: 'Sótano 2',
    zona: 'Zona C',
    estado: 'LIBRE',
    sensorCodigo: 'SNS-C09',
  },
  {
    id: 'plz-010',
    codigo: 'C-10',
    sotano: 'Sótano 2',
    zona: 'Zona C',
    estado: 'OCUPADA',
    sensorCodigo: 'SNS-C10',
    ocupante: { placa: 'MNO-987', usuario: 'Jorge Ramos', horaIngreso: haceMinutos(180) },
  },
  {
    id: 'plz-011',
    codigo: 'C-11',
    sotano: 'Sótano 2',
    zona: 'Zona C',
    estado: 'FUERA_DE_SERVICIO',
    sensorCodigo: 'SNS-C11',
  },
  {
    // Sin sensor asignado: cubre el caso de `sensorCodigo` ausente.
    id: 'plz-012',
    codigo: 'C-12',
    sotano: 'Sótano 2',
    zona: 'Zona C',
    estado: 'LIBRE',
  },
]
