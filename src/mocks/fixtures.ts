import type {
  CategoriaFaq,
  Cochera,
  EntradaAuditoria,
  Plaza,
  PreguntaFaq,
  Reserva,
  Sensor,
} from '@/lib/types/dominio'

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

export const CATEGORIAS_FAQ_MOCK: CategoriaFaq[] = [
  {
    id: 'cat-01',
    nombre: 'Reservas',
    orden: 1,
  },
  {
    id: 'cat-02',
    nombre: 'Ingreso al estacionamiento',
    orden: 2,
  },
]

export const PREGUNTAS_FAQ_MOCK: PreguntaFaq[] = [
  {
    id: 'faq-01',
    categoriaId: 'cat-01',
    pregunta: 'Cuanto dura una reserva?',
    respuesta: 'Una reserva permanece activa durante 30 minutos.',
    orden: 1,
  },
  {
    id: 'faq-02',
    categoriaId: 'cat-01',
    pregunta: 'Como cancelo una reserva?',
    respuesta: 'La reserva puede cancelarse desde la aplicacion antes de su vencimiento.',
    orden: 2,
  },
  {
    id: 'faq-03',
    categoriaId: 'cat-02',
    pregunta: 'Como ingreso al estacionamiento?',
    respuesta: 'El acceso se realiza utilizando el sistema habilitado por la universidad.',
    orden: 1,
  },
]

export const AUDITORIA_MOCK: EntradaAuditoria[] = [
  {
    id: 'aud-01',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'CANCELAR_RESERVA',
    elemento: 'Reserva res-01',
    ocurridoEn: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: 'aud-02',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'CREAR_CATEGORIA_FAQ',
    elemento: 'Categoria Reservas',
    ocurridoEn: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
  {
    id: 'aud-03',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'EDITAR_PREGUNTA_FAQ',
    elemento: 'Pregunta faq-01',
    ocurridoEn: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
]
