import { http, HttpResponse } from 'msw'
import type {
  Acceso,
  Cochera,
  CuentaAdmin,
  Pagina,
  Reserva,
  Sesion,
  Usuario,
} from '@/lib/types/dominio'
import {
  ACCESOS_MOCK,
  CLAVES_ADMIN_MOCK,
  COCHERAS_MOCK,
  PLAZAS_MOCK,
  SENSORES_MOCK,
  USUARIOS_MOCK,
  accesosDe,
  detalleDe,
  reservasDe,
} from '@/mocks/fixtures'
import { auditoria, cuentasAdmin, registrarAuditoria } from '@/mocks/estado'

/**
 * Contrato provisional. Cuando los microservicios esten definidos, este archivo
 * se borra y se apunta VITE_API_BASE_URL al backend real: los componentes ya
 * escriben el codigo definitivo, no hay que refactorizar.
 *
 * Mientras tanto respeta las decisiones del MVP: un solo rol (ADMINISTRADOR,
 * RFA09), una cochera y 8 plazas.
 */

const sesionAdmin: Sesion = {
  token: 'mock-token-admin',
  adminId: 'adm-001',
  nombre: 'Administrador',
  usuario: 'admin',
  correo: 'admin@utp.edu.pe',
  rol: 'ADMINISTRADOR',
  // 8 horas: RNF05.
  expiraEn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
}

/**
 * Recorta la pagina pedida al rango valido, como haria el backend real: la
 * vista manda `pagina` en base 1 y una pagina fuera de rango no debe devolver
 * items fantasma. Se comparte entre RFA01, RFA02 y RFA07 porque los tres relies
 * en el mismo `Pagina<T>`.
 */
function paginaDesde(request: Request, total: number) {
  const url = new URL(request.url)
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '10')))
  const ultima = Math.max(1, Math.ceil(total / pageSize))
  const pagina = Math.min(ultima, Math.max(1, Number(url.searchParams.get('pagina') ?? '1')))

  return { pagina, pageSize, total }
}

/** Devuelve el usuario del id, o responde 404 si no existe en el registro. */
function usuarioDe(params: Record<string, string | readonly string[] | undefined>) {
  const id = String(params.id)
  const indice = USUARIOS_MOCK.findIndex((u) => u.id === id)

  if (indice === -1) {
    return {
      fallo: HttpResponse.json(
        { message: 'No existe un usuario con ese identificador', codigo: 'USUARIO_NO_ENCONTRADO' },
        { status: 404 },
      ),
    }
  }

  return { usuario: USUARIOS_MOCK[indice], indice }
}

/**
 * Lee un filtro de rango de fechas como instante, en milisegundos, o null si no
 * vino. La vista convierte el `YYYY-MM-DD` del input de fecha a ISO con hora
 * local, asi que el backend solo compara instantes y no necesita saber en que
 * huso horario esta el administrador.
 */
function parametroInstante(url: URL, nombre: string): number | null {
  const crudo = url.searchParams.get(nombre)
  if (crudo === null || crudo === '') return null
  const valor = new Date(crudo).getTime()
  return Number.isNaN(valor) ? null : valor
}

/**
 * RFA07 no pide un orden, asi que se elige el ingreso mas reciente primero: es
 * el dia que el administrador recuerda cuando pregunta por "los ingresos del
 * martes", y es la columna por la que se filtran las fechas.
 *
 * El desempate por id no es cosmetico. Sin el, los accesos que comparten
 * `ingresoEn` al milisegundo (los del mock, y los de un mismo vehiculo que
 * entra y sale el mismo minuto) podrian cambiar de pagina entre peticiones y
 * hacer que una fila apareciera dos veces al paginar.
 */
function ordenarPorIngresoDescendente(a: Acceso, b: Acceso): number {
  const diferencia = new Date(b.ingresoEn).getTime() - new Date(a.ingresoEn).getTime()
  return diferencia !== 0 ? diferencia : a.id.localeCompare(b.id)
}

/**
 * La cuenta del panel que esta en sesion.
 *
 * RFA12 necesita una identidad para aplicar E2 (no puedes desactivar tu propia
 * cuenta). En la API real saldria del token; aca se fija en el admin sembrado.
 */
const ADMIN_EN_SESION = 'adm-001'

/**
 * Comprobaciones de RFA12 antes de desactivar una cuenta.
 *
 * Vive aqui y no importada desde `features/cuentas-admin` a proposito: cuando
 * exista la API real, `src/mocks/` se borra entero, y un mock que dependa de la
 * vista habria que reescribir. El server es la autoridad de estas reglas (regla
 * 8) y la vista solo replica las mismas para no ofrecer una accion que va a
 * fallar; cada excepcion esta anclada a su codigo, asi que si el backend cambia
 * el motivo, se cambia en los dos lados con el mismo E a la vista.
 */
function bloqueaDesactivacion(cuenta: CuentaAdmin, motivo: string) {
  if (cuenta.id === ADMIN_EN_SESION) {
    return { mensaje: 'No puedes desactivar la cuenta con la que iniciaste sesion.', regla: 'E2' }
  }
  if (cuenta.reservaActiva) {
    return { mensaje: 'La cuenta tiene una reserva de plaza activa.', regla: 'E3' }
  }
  if (motivo === 'DESACTIVAR_CUENTA') {
    const activas = cuentasAdmin.items.filter((c) => c.estado === 'ACTIVO').length
    if (activas <= 1) {
      return {
        mensaje: 'No puedes desactivar la ultima cuenta de administrador activa.',
        regla: 'E4',
      }
    }
  }

  return null
}

/** Nombre con el que el audit log registra al autor de la accion. */
function nombreAdminEnSesion() {
  return sesionAdmin.nombre
}

/**
 * La cuenta tal como sale hacia el front: con el flag de "esta es la tuya".
 *
 * El servidor es quien sabe de que token viene la peticion, asi que E2 no se
 * resuelve comparando ids en la vista ni pasándole el store de sesion de otra
 * feature.
 */
function comoSeVe(cuenta: CuentaAdmin): CuentaAdmin {
  return { ...cuenta, esLaCuentaEnSesion: cuenta.id === ADMIN_EN_SESION }
}

export const handlers = [
  // RFA09: login. El limite de 5 intentos (RNF07) lo lleva el servidor; aca se
  // simula el caso de exito, el de credenciales invalidas y, desde RFA12, el de
  // cuenta bloqueada.
  http.post('/api/auth/login', async ({ request }) => {
    const { usuario, contrasena } = (await request.json()) as {
      usuario?: string
      contrasena?: string
    }

    const cuenta = cuentasAdmin.items.find((c) => c.usuario === usuario)

    if (!cuenta || CLAVES_ADMIN_MOCK[cuenta.usuario] !== contrasena) {
      return HttpResponse.json(
        {
          message: 'Usuario o contrasena incorrectos',
          codigo: 'CREDENCIALES_INVALIDAS',
        },
        { status: 401 },
      )
    }

    // Criterio 6 de RFA12: una cuenta desactivada no puede volver a iniciar
    // sesion hasta ser reactivada.
    if (cuenta.estado === 'BLOQUEADO') {
      return HttpResponse.json(
        {
          message: 'La cuenta esta bloqueada. Contacta al administrador general.',
          codigo: 'CUENTA_BLOQUEADA',
        },
        { status: 403 },
      )
    }

    cuenta.ultimoAccesoEn = new Date().toISOString()

    return HttpResponse.json<Sesion>({
      ...sesionAdmin,
      adminId: cuenta.id,
      usuario: cuenta.usuario,
      correo: cuenta.correo,
      rol: cuenta.rol,
      token: `mock-token-${cuenta.id}`,
    })
  }),

  http.get('/api/auth/sesion', () => HttpResponse.json(sesionAdmin)),

  http.get('/api/overview', () => {
    const libres = PLAZAS_MOCK.filter((p) => p.estado === 'LIBRE').length
    const online = SENSORES_MOCK.filter((s) => s.estado === 'ACTIVO').length

    return HttpResponse.json({
      totalPlazas: PLAZAS_MOCK.length,
      plazasLibres: libres,
      ocupacionPorcentaje: 38.3,
      reservasActivas: 12,
      sensoresOnline: online,
      sensoresTotal: SENSORES_MOCK.length,
      servidorDisponible: true,
      ultimaActualizacion: new Date().toISOString(),
    })
  }),

  // Catalogo de cocheras. RNF11 lo lee de la configuracion, no del codigo, asi
  // que se expone como lista: el filtro por cochera de RFA07 y el selector del
  // dashboard (RFA11) lo recorren.
  http.get('/api/cocheras', () =>
    HttpResponse.json<{ items: Cochera[] }>({ items: COCHERAS_MOCK }),
  ),

  // RFA03: estado de las plazas para el Monitor.
  http.get('/api/plazas', () => HttpResponse.json({ items: PLAZAS_MOCK })),

  // RFA01: lista paginada de usuarios con filtros server-side (busqueda,
  // tipo y estado). La busqueda no distingue mayusculas y barre nombre y
  // codigo, como pide el flujo de eventos (paso 3).
  http.get('/api/usuarios', ({ request }) => {
    const url = new URL(request.url)
    const busqueda = (url.searchParams.get('busqueda') ?? '').trim().toLowerCase()

    const filtrados = USUARIOS_MOCK.filter((u) => {
      const porTermino =
        busqueda === '' ||
        u.nombre.toLowerCase().includes(busqueda) ||
        u.codigo.toLowerCase().includes(busqueda)
      const porTipo =
        (url.searchParams.get('tipo') ?? '') === '' || u.tipo === url.searchParams.get('tipo')
      const porEstado =
        (url.searchParams.get('estado') ?? '') === '' || u.estado === url.searchParams.get('estado')
      return porTermino && porTipo && porEstado
    })

    // La pagina viene en base 1 desde la vista; se recorta al rango valido
    // para que una pagina fuera de rango no devuelva items fantasma.
    const { pagina, pageSize, total } = paginaDesde(request, filtrados.length)
    const items = filtrados.slice((pagina - 1) * pageSize, pagina * pageSize)

    return HttpResponse.json<Pagina<Usuario>>({ items, total, pagina, pageSize })
  }),

  // RFA02: perfil completo de un usuario. Responde 404 con un id desconocido
  // para que la vista pueda distinguir "no existe" de "el servidor fallo", que
  // son dos mensajes distintos para el administrador.
  http.get('/api/usuarios/:id', ({ params }) => {
    const encontrado = usuarioDe(params)
    if ('fallo' in encontrado) return encontrado.fallo

    return HttpResponse.json(detalleDe(encontrado.usuario, encontrado.indice))
  }),

  // RFA02: historiales del usuario, paginados en el servidor. Mismo criterio que
  // RFA01: la vista elige la pagina y el backend recorta.
  http.get('/api/usuarios/:id/accesos', ({ params, request }) => {
    const encontrado = usuarioDe(params)
    if ('fallo' in encontrado) return encontrado.fallo

    const todos: Acceso[] = accesosDe(encontrado.usuario, encontrado.indice)
    const { pagina, pageSize, total } = paginaDesde(request, todos.length)

    return HttpResponse.json<Pagina<Acceso>>({
      items: todos.slice((pagina - 1) * pageSize, pagina * pageSize),
      total,
      pagina,
      pageSize,
    })
  }),

  http.get('/api/usuarios/:id/reservas', ({ params, request }) => {
    const encontrado = usuarioDe(params)
    if ('fallo' in encontrado) return encontrado.fallo

    const todos: Reserva[] = reservasDe(encontrado.usuario, encontrado.indice)
    const { pagina, pageSize, total } = paginaDesde(request, todos.length)

    return HttpResponse.json<Pagina<Reserva>>({
      items: todos.slice((pagina - 1) * pageSize, pagina * pageSize),
      total,
      pagina,
      pageSize,
    })
  }),

  // RFA07: historial de ingresos y salidas con filtros por usuario, cochera,
  // plaza y rango de fechas. Todo se resuelve en el servidor, igual que en
  // RFA01: la vista elige que quiere ver y el backend pagina.
  http.get('/api/accesos', ({ request }) => {
    const url = new URL(request.url)
    const busqueda = (url.searchParams.get('busqueda') ?? '').trim().toLowerCase()
    const cocheraId = url.searchParams.get('cocheraId') ?? ''
    const plazaId = url.searchParams.get('plazaId') ?? ''
    const desde = parametroInstante(url, 'desde')
    const hasta = parametroInstante(url, 'hasta')

    const filtrados = ACCESOS_MOCK.filter((acceso) => {
      const porTermino =
        busqueda === '' ||
        acceso.nombreUsuario.toLowerCase().includes(busqueda) ||
        acceso.codigoUsuario.toLowerCase().includes(busqueda)
      const porCochera = cocheraId === '' || acceso.cocheraId === cocheraId
      const porPlaza = plazaId === '' || acceso.plazaId === plazaId
      const ingreso = new Date(acceso.ingresoEn).getTime()
      return (
        porTermino &&
        porCochera &&
        porPlaza &&
        (desde === null || ingreso >= desde) &&
        (hasta === null || ingreso <= hasta)
      )
    }).sort(ordenarPorIngresoDescendente)

    const { pagina, pageSize, total } = paginaDesde(request, filtrados.length)

    return HttpResponse.json<Pagina<Acceso>>({
      items: filtrados.slice((pagina - 1) * pageSize, pagina * pageSize),
      total,
      pagina,
      pageSize,
    })
  }),

  // RFA12: cuentas de administrador. A diferencia de RFA01 y RFA07, aqui no hay
  // paginacion ni filtros: el paso 2 del flujo solo pide la lista, y las cuentas
  // del panel se cuentan con una mano.
  http.get('/api/cuentas-admin', () =>
    HttpResponse.json({ items: cuentasAdmin.items.map(comoSeVe) }),
  ),

  http.post('/api/cuentas-admin', async ({ request }) => {
    const cuerpo = (await request.json()) as Partial<CuentaAdmin> & { contrasena?: string }

    // E1: el nombre de usuario es unico. Se compara sin distincion de mayusculas
    // porque "MGomez" y "mgomez" no pueden ser dos personas distintas.
    const duplicado = cuentasAdmin.items.some(
      (c) => c.usuario.toLowerCase() === (cuerpo.usuario ?? '').toLowerCase(),
    )

    if (duplicado) {
      return HttpResponse.json(
        {
          message: 'Ese nombre de usuario ya esta registrado.',
          codigo: 'USUARIO_YA_REGISTRADO',
        },
        { status: 409 },
      )
    }

    const cuenta: CuentaAdmin = {
      id: `adm-${String(cuentasAdmin.items.length + 1).padStart(3, '0')}`,
      usuario: cuerpo.usuario ?? '',
      correo: cuerpo.correo ?? '',
      rol: cuerpo.rol ?? 'ADMINISTRADOR',
      // Paso 4: la cuenta nace activa.
      estado: 'ACTIVO',
      creadoEn: new Date().toISOString(),
    }

    cuentasAdmin.items.push(cuenta)

    registrarAuditoria({
      adminId: ADMIN_EN_SESION,
      adminNombre: nombreAdminEnSesion(),
      accion: 'CREAR_CUENTA',
      elemento: cuenta.correo,
    })

    return HttpResponse.json(comoSeVe(cuenta), { status: 201 })
  }),

  http.patch('/api/cuentas-admin/:id', async ({ params, request }) => {
    const id = String(params.id)
    const indice = cuentasAdmin.items.findIndex((c) => c.id === id)

    if (indice === -1) {
      return HttpResponse.json(
        { message: 'La cuenta no existe.', codigo: 'CUENTA_NO_ENCONTRADA' },
        { status: 404 },
      )
    }

    const cuenta = cuentasAdmin.items[indice]
    const cuerpo = (await request.json()) as Partial<CuentaAdmin> & { motivo?: string }
    const cambio: Partial<CuentaAdmin> = {}
    let accion = 'EDITAR_CUENTA'

    // Paso 5: la edicion solo toca el correo institucional o el rol. El usuario
    // no se renombra, porque `ConfirmDialog` y el login lo tratan como identidad.
    if (cuerpo.correo !== undefined && cuerpo.correo !== cuenta.correo) {
      cambio.correo = cuerpo.correo
    }
    if (cuerpo.rol !== undefined && cuerpo.rol !== cuenta.rol) {
      cambio.rol = cuerpo.rol
    }

    if (cuerpo.estado !== undefined && cuerpo.estado !== cuenta.estado) {
      if (cuerpo.estado === 'BLOQUEADO') {
        const bloqueo = bloqueaDesactivacion(cuenta, 'DESACTIVAR_CUENTA')
        if (bloqueo) {
          return HttpResponse.json(
            { message: bloqueo.mensaje, codigo: bloqueo.regla },
            { status: 409 },
          )
        }
      }

      cambio.estado = cuerpo.estado
      accion = cuerpo.estado === 'BLOQUEADO' ? 'DESACTIVAR_CUENTA' : 'REACTIVAR_CUENTA'
    }

    // Guardar sin haber tocado nada no es un error: se responde la cuenta tal
    // cual y no se ensucia el audit log con una entrada que no describe nada.
    if (Object.keys(cambio).length === 0) {
      return HttpResponse.json(comoSeVe(cuenta))
    }

    cuentasAdmin.items[indice] = { ...cuenta, ...cambio }

    registrarAuditoria({
      adminId: ADMIN_EN_SESION,
      adminNombre: nombreAdminEnSesion(),
      accion,
      elemento: cuenta.correo,
      ...(cambio.estado === 'BLOQUEADO' ? { motivo: cuerpo.motivo } : {}),
    })

    return HttpResponse.json(comoSeVe(cuentasAdmin.items[indice]))
  }),

  // RFA10 lo consulta otra historia; RFA12 solo necesita que exista la lista.
  http.get('/api/auditoria', () => HttpResponse.json({ items: auditoria.items })),
]
