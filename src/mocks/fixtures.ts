import type { Cochera, Plaza, Sensor, Usuario } from '@/lib/types/dominio'

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

/**
 * Usuarios de la app para RFA01. Suficientes para probar la paginacion
 * server-side (25 > 10 por pagina) y variados en tipo, estado y codigo para
 * que los filtros de la vista tengan contra que filtrar.
 */
type UsuarioSeed = [
  id: string,
  codigo: string,
  nombre: string,
  correo: string,
  tipo: Usuario['tipo'],
  estado: Usuario['estado'],
  registradoEn: string,
]

const SEMBRADOR_USUARIOS: UsuarioSeed[] = [
  [
    'usr-01',
    '20241001',
    'Ana Quispe Huaman',
    'ana.quispe@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-14T09:12:00Z',
  ],
  [
    'usr-02',
    '20241002',
    'Carlos Mendoza Rojas',
    'carlos.mendoza@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-14T11:40:00Z',
  ],
  [
    'usr-03',
    '20241003',
    'Maria Gutierrez Salazar',
    'maria.gutierrez@utp.edu.pe',
    'DOCENTE',
    'ACTIVO',
    '2026-08-15T08:05:00Z',
  ],
  [
    'usr-04',
    '20241004',
    'Jose Luis Ramos Paredes',
    'jose.ramos@utp.edu.pe',
    'ALUMNO',
    'BLOQUEADO',
    '2026-08-15T14:22:00Z',
  ],
  [
    'usr-05',
    '20241005',
    'Lucia Flores Vargas',
    'lucia.flores@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-16T10:18:00Z',
  ],
  [
    'usr-06',
    '20241006',
    'Pedro Sanchez Diaz',
    'pedro.sanchez@utp.edu.pe',
    'ADMINISTRATIVO',
    'ACTIVO',
    '2026-08-16T16:47:00Z',
  ],
  [
    'usr-07',
    '20241007',
    'Rosa Chavez Nunez',
    'rosa.chavez@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-18T09:31:00Z',
  ],
  [
    'usr-08',
    '20241008',
    'Diego Torres Espinoza',
    'diego.torres@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-18T13:09:00Z',
  ],
  [
    'usr-09',
    '20241009',
    'Katherine Silva Leon',
    'katherine.silva@utp.edu.pe',
    'VISITANTE',
    'ACTIVO',
    '2026-08-19T18:02:00Z',
  ],
  [
    'usr-10',
    '20241010',
    'Jorge Vasquez Ortiz',
    'jorge.vasquez@utp.edu.pe',
    'DOCENTE',
    'ACTIVO',
    '2026-08-20T07:55:00Z',
  ],
  [
    'usr-11',
    '20241011',
    'Carmen Rojas Aguilar',
    'carmen.rojas@utp.edu.pe',
    'ALUMNO',
    'BLOQUEADO',
    '2026-08-21T12:33:00Z',
  ],
  [
    'usr-12',
    '20241012',
    'Luis Huaman Torres',
    'luis.huaman@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-22T15:41:00Z',
  ],
  [
    'usr-13',
    '20241013',
    'Patricia Castillo Medina',
    'patricia.castillo@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-24T10:27:00Z',
  ],
  [
    'usr-14',
    '20241014',
    'Miguel Angel Paredes Luna',
    'miguel.paredes@utp.edu.pe',
    'DOCENTE',
    'ACTIVO',
    '2026-08-25T09:03:00Z',
  ],
  [
    'usr-15',
    '20241015',
    'Daniela Cardenas Rios',
    'daniela.cardenas@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-26T17:20:00Z',
  ],
  [
    'usr-16',
    '20241016',
    'Renzo Maldonado Romero',
    'renzo.maldonado@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-27T08:48:00Z',
  ],
  [
    'usr-17',
    '20241017',
    'Stefany Espinoza Quispe',
    'stefany.espinoza@utp.edu.pe',
    'ADMINISTRATIVO',
    'ACTIVO',
    '2026-08-28T11:14:00Z',
  ],
  [
    'usr-18',
    '20241018',
    'Marco Antonio Benavides Soto',
    'marco.benavides@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-29T09:56:00Z',
  ],
  [
    'usr-19',
    '20241019',
    'Nadia Herrera Campos',
    'nadia.herrera@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-08-31T14:07:00Z',
  ],
  [
    'usr-20',
    '20241020',
    'Gustavo Palomino Chavez',
    'gustavo.palomino@utp.edu.pe',
    'DOCENTE',
    'ACTIVO',
    '2026-09-01T10:39:00Z',
  ],
  [
    'usr-21',
    '20241021',
    'Valeria Quinteros Vega',
    'valeria.quinteros@utp.edu.pe',
    'ALUMNO',
    'BLOQUEADO',
    '2026-09-02T16:25:00Z',
  ],
  [
    'usr-22',
    '20241022',
    'Fernando Salazar Bedoya',
    'fernando.salazar@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-09-04T09:11:00Z',
  ],
  [
    'usr-23',
    '20241023',
    'Alicia Montes Yupanqui',
    'alicia.montes@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-09-06T13:52:00Z',
  ],
  [
    'usr-24',
    '20241024',
    'Erick Bustamante Llanos',
    'erick.bustamante@utp.edu.pe',
    'VISITANTE',
    'ACTIVO',
    '2026-09-08T18:30:00Z',
  ],
  [
    'usr-25',
    '20241025',
    'Isabella Condori Mamani',
    'isabella.condori@utp.edu.pe',
    'ALUMNO',
    'ACTIVO',
    '2026-09-10T08:16:00Z',
  ],
]

export const USUARIOS_MOCK: Usuario[] = SEMBRADOR_USUARIOS.map(
  ([id, codigo, nombre, correo, tipo, estado, registradoEn]) => ({
    id,
    codigo,
    nombre,
    correo,
    tipo,
    estado,
    registradoEn,
  }),
)
