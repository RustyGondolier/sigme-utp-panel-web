import type { Cochera, Plaza, Reserva, Sensor } from '@/lib/types/dominio'

/**
 * Fixtures minimos para que las vistas se puedan desarrollar y testear sin
 * backend. Solo lo necesario para pintar cada estado: cuatro plazas (una por
 * estado) mas cuatro libres, en total las 8 del MVP.
 */

export const COCHERA_PRINCIPAL: Cochera = {
  id: 'coch-01',
  nombre: 'Cochera principal',
  totalPlazas: 8,
}

const hace = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString()

export const PLAZAS_MOCK: Plaza[] = [
  {
    id: 'pla-01',
    codigo: 'A-01',
    cocheraId: COCHERA_PRINCIPAL.id,
    estado: 'LIBRE',
    sensorId: 'sen-01',
  },
  {
    id: 'pla-02',
    codigo: 'A-02',
    cocheraId: COCHERA_PRINCIPAL.id,
    estado: 'OCUPADA',
    sensorId: 'sen-02',
    ocupante: {
      usuarioId: 'usr-01',
      nombre: 'Ana Quispe',
      codigoUsuario: '20241234',
      vehiculo: 'ABC-123',
      ingresoEn: hace(135),
    },
  },
  {
    id: 'pla-03',
    codigo: 'A-03',
    cocheraId: COCHERA_PRINCIPAL.id,
    estado: 'RESERVADA',
    sensorId: 'sen-03',
  },
  {
    id: 'pla-04',
    codigo: 'A-04',
    cocheraId: COCHERA_PRINCIPAL.id,
    // Sin sensor: por eso la plaza queda FUERA_DE_SERVICIO. RFA04 lo pide asi.
    estado: 'FUERA_DE_SERVICIO',
  },
  ...['A-05', 'A-06', 'A-07', 'A-08'].map((codigo, indice) => ({
    id: `pla-${String(indice + 5).padStart(2, '0')}`,
    codigo,
    cocheraId: COCHERA_PRINCIPAL.id,
    estado: 'LIBRE' as const,
    sensorId: `sen-${String(indice + 5).padStart(2, '0')}`,
  })),
]

export const SENSORES_MOCK: Sensor[] = PLAZAS_MOCK.flatMap((plaza, indice) =>
  plaza.sensorId
    ? [
        {
          id: plaza.sensorId,
          identificador: `SN-${String(indice + 1).padStart(3, '0')}`,
          plazaId: plaza.id,
          codigoPlaza: plaza.codigo,
          cocheraId: plaza.cocheraId,
          estado: indice === 6 ? ('FUERA_DE_SERVICIO' as const) : ('ACTIVO' as const),
          ultimoReporteEn: hace(1),
        },
      ]
    : [],
)

const en = (minutos: number) => new Date(Date.now() + minutos * 60_000).toISOString()

export const RESERVAS_MOCK: Reserva[] = [
  {
    id: 'res-01',
    usuarioId: 'usr-02',
    codigoUsuario: '20245555',
    nombreUsuario: 'Luis Mendoza',
    cocheraId: COCHERA_PRINCIPAL.id,
    plazaId: 'pla-03',
    codigoPlaza: 'A-03',
    estado: 'ACTIVA',
    solicitadaEn: hace(10),
    venceEn: en(20),
  },
  {
    id: 'res-02',
    usuarioId: 'usr-03',
    codigoUsuario: '20246666',
    nombreUsuario: 'Maria Torres',
    cocheraId: COCHERA_PRINCIPAL.id,
    plazaId: 'pla-05',
    codigoPlaza: 'A-05',
    estado: 'ACTIVA',
    solicitadaEn: hace(5),
    venceEn: en(25),
  },
]
