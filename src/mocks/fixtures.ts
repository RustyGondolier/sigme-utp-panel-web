import type {
  Acceso,
  CategoriaFaq,
  Cochera,
  CuentaAdmin,
  DetalleUsuario,
  EntradaAuditoria,
  EstadoReserva,
  Plaza,
  PreguntaFaq,
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

/**
 * Lista de cocheras, no una cochera.
 *
 * RNF11 pide que agregar una cochera sea cambiar la base de datos y no el
 * codigo, asi que el catalogo se expone como arreglo desde el principio. El
 * filtro por cochera de RFA07 y el selector de cocheras del dashboard (RFA11)
 * recorren esto, no una constante suelta.
 */
export const COCHERAS_MOCK: Cochera[] = [COCHERA_PRINCIPAL]

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
 * Minutos entre que se pide la plaza y que entra el vehiculo.
 *
 * Tiene que caber dentro de la vigencia de la reserva (RFA05, 30 minutos): si el
 * ingreso caeria despues, la fila mostraria un ingreso que su reserva ya no
 * cubria y el historial contaria una situacion imposible.
 */
const minutosDeSolicitud = (indice: number) => 2 + (indice % 5) * 4

/** Resta los minutos de espera a un ingreso, para obtener cuando se pidio. */
const solicitadaAntesDe = (ingresoEn: string, indice: number) =>
  new Date(new Date(ingresoEn).getTime() - minutosDeSolicitud(indice) * 60_000).toISOString()

/**
 * Historial de accesos. Todos son eventos ya cerrados salvo el ingreso abierto
 * del usuario que esta adentro ahora mismo, que es el unico con `salidaEn`
 * ausente.
 */
export function accesosDe(usuario: Usuario, indice: number): Acceso[] {
  const abierto = ingresoAbierto(indice)
  const plazaDe = (numero: number) => PLAZAS_MOCK[(indice + numero) % PLAZAS_MOCK.length]

  const lista: Acceso[] = Array.from({ length: ACCESOS_POR_USUARIO }, (_, numero) => {
    const sigueAbierto = numero === 0 && abierto !== null
    const ingresoEn = haceDias(numero + 1 + (indice % 9))
    const horasDentro = 1 + (indice % 5)
    const plaza = plazaDe(numero)

    return {
      id: `acc-${String(indice + 1).padStart(2, '0')}-${String(numero + 1).padStart(2, '0')}`,
      usuarioId: usuario.id,
      codigoUsuario: usuario.codigo,
      nombreUsuario: usuario.nombre,
      cocheraId: COCHERA_PRINCIPAL.id,
      cocheraNombre: COCHERA_PRINCIPAL.nombre,
      plazaId: plaza.id,
      codigoPlaza: plaza.codigo,
      vehiculo: vehiculosDe(indice)[0]?.placa ?? placaDe(indice, 0),
      solicitadaEn: solicitadaAntesDe(ingresoEn, indice),
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
      plazaId: abierto.plazaId,
      codigoPlaza: abierto.codigoPlaza,
      solicitadaEn: solicitadaAntesDe(abierto.ingresoEn, indice),
      ingresoEn: abierto.ingresoEn,
    }
  }

  return lista
}

/**
 * Historial global de accesos: la fuente de RFA07.
 *
 * Aplana el historial de los 25 usuarios, asi que son 300 registros y la
 * paginacion server-side tiene varias paginas que recorrer. Cada usuario aporta
 * accesos en dias distintos (de 1 a 20 dias atras, corridos segun su indice), de
 * modo que el filtro por rango de fechas siempre tiene dias con datos: los dias
 * mas recientes son los mas poblados (el de hace 2 dias trae 6 accesos y el de
 * hace 3, nueve, porque a menor numero de dias mas usuarios alcanzan a tener un
 * ingreso), y los mas antiguos se van vaciando hasta llegar a cero.
 *
 * Se calcula una sola vez al cargar el modulo, igual que `PLAZAS_MOCK`: el mock
 * tiene que ser determinista para que los tests no dependan de `Math.random` ni
 * de la hora exacta en que arranco la suite.
 */
export const ACCESOS_MOCK: Acceso[] = USUARIOS_MOCK.flatMap((usuario, indice) =>
  accesosDe(usuario, indice),
)

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

/**
 * Cuentas de administrador del panel (RFA12).
 *
 * `adm-001` es la cuenta del mock de sesion, asi que el administrador que entra
 * a la demo existe en la lista y puede usar las reglas E2 y E4. Se siembran tres
 * activas y una bloqueada para que los tres caminos del listado se vean de una:
 * la propia, la que tiene reserva y la que esta bloqueada.
 */
export const CUENTAS_ADMIN_MOCK: CuentaAdmin[] = [
  {
    id: 'adm-001',
    usuario: 'admin',
    correo: 'admin@utp.edu.pe',
    rol: 'ADMINISTRADOR',
    estado: 'ACTIVO',
    creadoEn: haceDias(240),
    ultimoAccesoEn: hace(5),
  },
  {
    id: 'adm-002',
    usuario: 'mgomez',
    correo: 'maria.gomez@utp.edu.pe',
    rol: 'ADMINISTRADOR',
    estado: 'ACTIVO',
    creadoEn: haceDias(120),
    ultimoAccesoEn: hace(300),
    // E3: la regla que impide desactivar una cuenta con reserva de plaza activa.
    reservaActiva: true,
  },
  {
    id: 'adm-003',
    usuario: 'rsoto',
    correo: 'raul.soto@utp.edu.pe',
    rol: 'ADMINISTRADOR',
    estado: 'ACTIVO',
    creadoEn: haceDias(45),
  },
  {
    id: 'adm-004',
    usuario: 'lparedes',
    correo: 'lucia.paredes@utp.edu.pe',
    rol: 'ADMINISTRADOR',
    estado: 'BLOQUEADO',
    creadoEn: haceDias(400),
    ultimoAccesoEn: hace(20_000),
  },
]

/**
 * Contrasenas de las cuentas, en un mapa aparte y no dentro de `CuentaAdmin`.
 *
 * RFA12 exige que cada cuenta tenga credenciales propias, pero el hash nunca
 * viaja al cliente: si la contrasena viviera en la cuenta, un `GET` de la lista
 * la devolveria en la respuesta. El login compara contra este mapa.
 */
export const CLAVES_ADMIN_MOCK: Record<string, string> = {
  admin: 'utp2026',
  mgomez: 'utp2026',
  rsoto: 'utp2026',
  lparedes: 'utp2026',
}

/**
 * Audit log sembrado (RFA10).
 *
 * RFA12 solo escribe entradas; la pantalla que las lee es de otra historia, asi
 * que estas tres son historicas, para que esa vista no arranque vacia. Van en
 * UTC, como manda RFA10.
 */
export const AUDITORIA_MOCK: EntradaAuditoria[] = [
  {
    id: 'aud-006',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'CANCELAR_RESERVA',
    elemento: 'Reserva res-01',
    ocurridoEn: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: 'aud-005',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'CREAR_CATEGORIA_FAQ',
    elemento: 'Categoria Reservas',
    ocurridoEn: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
  {
    id: 'aud-004',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'EDITAR_PREGUNTA_FAQ',
    elemento: 'Pregunta faq-01',
    ocurridoEn: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
  {
    id: 'aud-003',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'CREAR_CUENTA',
    elemento: 'rsoto@utp.edu.pe',
    ocurridoEn: haceDias(1),
  },
  {
    id: 'aud-002',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'DESACTIVAR_CUENTA',
    elemento: 'invitado@utp.edu.pe',
    ocurridoEn: haceDias(2),
    motivo: 'Cuenta temporal de la demo de admision',
  },
  {
    id: 'aud-001',
    adminId: 'adm-001',
    adminNombre: 'Administrador',
    accion: 'EDITAR_CUENTA',
    elemento: 'admin@utp.edu.pe',
    ocurridoEn: haceDias(4),
  },
]
