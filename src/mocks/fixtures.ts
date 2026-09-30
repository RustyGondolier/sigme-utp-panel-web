import type {
  Acceso,
  Cochera,
  DetalleUsuario,
  EstadoReserva,
  Plaza,
  Reserva,
  Sensor,
  Usuario,
  Vehiculo,
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

/* -------------------------------------------------------------------------- */
/* RFA02: perfil, vehiculos e historiales del usuario                          */
/* -------------------------------------------------------------------------- */

/**
 * Los historiales se generan en vez de escribirse a mano por una razon concreta:
 * RFA02 los muestra paginados, asi que hacen falta mas de una pagina por
 * usuario para que el paginador tenga algo que paginar. Con 12 accesos y 13
 * reservas por usuario se prueban los dos casos sin escribir a mano 25 bloques
 * de datos que nadie va a leer.
 *
 * Todo se deriva del indice del usuario, asi que el mock es determinista: el
 * mismo usuario tiene siempre el mismo historial y los tests no dependen de
 * Math.random.
 */

/** Accesos por usuario: superan el pageSize de 10 para probar la paginacion. */
const ACCESOS_POR_USUARIO = 12
/** RFA05: la reserva vive 30 minutos desde que se solicita. */
const VIGENCIA_RESERVA_MIN = 30
const RESERVAS_POR_USUARIO = 13

const MARCAS: [string, string][] = [
  ['Toyota', 'Yaris'],
  ['Hyundai', 'Accent'],
  ['Kia', 'Rio'],
  ['Nissan', 'March'],
  ['Volkswagen', 'Gol'],
  ['Chevrolet', 'Onix'],
  ['Renault', 'Sandero'],
  ['Mazda', 'Mazda 2'],
]

const COLORES = ['Blanco', 'Negro', 'Plata', 'Azul', 'Rojo', 'Gris']

/**
 * El unico ingreso abierto del sistema, y el unico vehiculo ocupando una plaza.
 * Se lee de PLAZAS_MOCK en vez de hardcodearlo para que el Monitor (RFA03) y el
 * perfil del usuario (RFA02) no se contradigan en la demo.
 */
const OCUPANTE_ABIERTO = PLAZAS_MOCK[1].ocupante

/**
 * Datos del ingreso abierto de un usuario, o null si todavia no entro.
 *
 * Se devuelve un objeto ya armado en vez de `ocupante` mas una bandera porque
 * TypeScript no estrecha un campo opcional a traves de un booleano, y la
 * alternativa es escribir aserciones no-null en tres lugares.
 */
function ingresoAbierto(indice: number) {
  if (indice !== 0 || !OCUPANTE_ABIERTO) return null
  return {
    vehiculo: OCUPANTE_ABIERTO.vehiculo,
    ingresoEn: OCUPANTE_ABIERTO.ingresoEn,
    plazaId: PLAZAS_MOCK[1].id,
    codigoPlaza: PLAZAS_MOCK[1].codigo,
  }
}

/** Placa peruana: dos letras, guion, dos digitos y dos letras. */
function placaDe(indice: number, numero: number): string {
  const letras = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  const digitos = String(((indice + 1) * 13 + numero * 5) % 100).padStart(2, '0')
  return (
    letras[indice % letras.length] +
    letras[(indice * 7 + numero) % letras.length] +
    '-' +
    digitos +
    letras[(indice * 5 + numero) % letras.length] +
    letras[(indice * 11 + numero * 3) % letras.length]
  )
}

/** Cuantos vehiculos tiene: de 0 a 3, para que la vista muestre el caso vacio. */
const cantidadVehiculos = (indice: number) => (indice % 4 === 3 ? 0 : (indice % 3) + 1)

const haceDias = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString()

/**
 * Vehiculos registrados. El primero es el principal (RF10) y, si el usuario
 * tiene un ingreso abierto, ese mismo es el que ocupa la plaza.
 */
export function vehiculosDe(indice: number): Vehiculo[] {
  const abierto = ingresoAbierto(indice)

  return Array.from({ length: cantidadVehiculos(indice) }, (_, numero) => {
    const [marca, modelo] = MARCAS[(indice + numero) % MARCAS.length]
    const enPlaza = numero === 0 && abierto !== null

    return {
      id: `veh-${String(indice + 1).padStart(2, '0')}-${numero + 1}`,
      placa: enPlaza && abierto ? abierto.vehiculo : placaDe(indice, numero),
      marca,
      modelo,
      color: COLORES[(indice + numero * 2) % COLORES.length],
      principal: numero === 0,
      registradoEn: haceDias(30 - indice - numero),
      ...(enPlaza && abierto
        ? {
            ocupacion: {
              plazaId: abierto.plazaId,
              codigoPlaza: abierto.codigoPlaza,
              ingresoEn: abierto.ingresoEn,
            },
          }
        : {}),
    }
  })
}

/**
 * Historial de accesos. Todos son eventos ya cerrados salvo el ingreso abierto
 * del usuario que esta adentro ahora mismo, que es el unico con `salidaEn`
 * ausente.
 */
export function accesosDe(usuario: Usuario, indice: number): Acceso[] {
  const abierto = ingresoAbierto(indice)
  const placas = PLAZAS_MOCK

  const lista: Acceso[] = Array.from({ length: ACCESOS_POR_USUARIO }, (_, numero) => {
    const sigueAbierto = numero === 0 && abierto !== null
    const ingresoEn = haceDias(numero + 1 + (indice % 9))
    const horasDentro = 1 + (indice % 5)

    return {
      id: `acc-${String(indice + 1).padStart(2, '0')}-${String(numero + 1).padStart(2, '0')}`,
      usuarioId: usuario.id,
      codigoUsuario: usuario.codigo,
      nombreUsuario: usuario.nombre,
      cocheraId: COCHERA_PRINCIPAL.id,
      codigoPlaza: placas[(indice + numero) % placas.length].codigo,
      vehiculo: vehiculosDe(indice)[0]?.placa ?? placaDe(indice, 0),
      ingresoEn,
      ...(sigueAbierto
        ? {}
        : {
            salidaEn: new Date(
              new Date(ingresoEn).getTime() + horasDentro * 3_600_000,
            ).toISOString(),
          }),
      estado: sigueAbierto ? 'DENTRO' : 'FUERA',
    }
  })

  // El ingreso abierto tiene que mostrar la plaza que realmente ocupa, no la que
  // le tocaria por la formula: el Monitor dice que el vehiculo esta en A-02.
  if (abierto) {
    lista[0] = {
      ...lista[0],
      codigoPlaza: abierto.codigoPlaza,
      ingresoEn: abierto.ingresoEn,
    }
  }

  return lista
}

/** Estados de reserva mezclados, para que el historial tenga de cada uno. */
const CICLO_RESERVAS: EstadoReserva[] = [
  'COMPLETADA',
  'COMPLETADA',
  'EXPIRADA',
  'COMPLETADA',
  'CANCELADA_POR_ADMIN',
  'EXPIRADA',
  'COMPLETADA',
  'EXPIRADA',
  'COMPLETADA',
  'EXPIRADA',
  'COMPLETADA',
  'CANCELADA_POR_ADMIN',
  'EXPIRADA',
]

/**
 * Historial de reservas. La primera esta activa y es la unica sin cerrar, que es
 * lo que veria en su app un usuario con el proceso en curso.
 */
export function reservasDe(usuario: Usuario, indice: number): Reserva[] {
  const plazas = PLAZAS_MOCK

  return Array.from({ length: RESERVAS_POR_USUARIO }, (_, numero) => {
    const solicitadaEn = new Date(
      Date.now() - (numero * 2 + 1) * 86_400_000 + (indice % 7) * 3_600_000,
    ).toISOString()
    const plaza = plazas[(indice + numero) % plazas.length]

    return {
      id: `res-${String(indice + 1).padStart(2, '0')}-${String(numero + 1).padStart(2, '0')}`,
      usuarioId: usuario.id,
      codigoUsuario: usuario.codigo,
      nombreUsuario: usuario.nombre,
      cocheraId: COCHERA_PRINCIPAL.id,
      plazaId: plaza.id,
      codigoPlaza: plaza.codigo,
      estado: numero === 0 ? 'ACTIVA' : CICLO_RESERVAS[numero % CICLO_RESERVAS.length],
      solicitadaEn,
      venceEn: new Date(
        new Date(solicitadaEn).getTime() + VIGENCIA_RESERVA_MIN * 60_000,
      ).toISOString(),
    }
  })
}

/** Datos personales de RNF12, que la fila de RFA01 no necesita mostrar. */
function datosSensibleDe(indice: number) {
  return {
    dni: String(70_000_000 + indice * 137_891),
    telefono: `9${String(10_000_000 + indice * 31_337).slice(0, 8)}`,
    licenciaConducir: `Q${String(20_000_000 + indice * 41_113).slice(0, 8)}`,
    // El CONADIS solo aplica a quien lo tiene: no todos lo necesitan.
    ...(indice % 3 === 0 ? { conadis: `CD-${String(1000 + indice).padStart(5, '0')}` } : {}),
  }
}

/** Perfil completo: lo de RFA01 mas lo que solo importa en el detalle. */
export function detalleDe(usuario: Usuario, indice: number): DetalleUsuario {
  return {
    perfil: { ...usuario, ...datosSensibleDe(indice) },
    vehiculos: vehiculosDe(indice),
  }
}
