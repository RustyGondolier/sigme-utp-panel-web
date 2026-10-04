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
  CATEGORIAS_FAQ_MOCK,
  CLAVES_ADMIN_MOCK,
  COCHERAS_MOCK,
  PLAZAS_MOCK,
  PREGUNTAS_FAQ_MOCK,
  RESERVAS_MOCK,
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

const FAQ_ORDEN_STORAGE_KEY = 'sigme-faq-orden'

function guardarOrdenFaq(categoriaId: string, ids: string[]) {
  if (typeof localStorage === 'undefined') return

  const guardado = localStorage.getItem(FAQ_ORDEN_STORAGE_KEY)
  const ordenes = guardado ? (JSON.parse(guardado) as Record<string, string[]>) : {}

  ordenes[categoriaId] = ids

  localStorage.setItem(FAQ_ORDEN_STORAGE_KEY, JSON.stringify(ordenes))
}

function aplicarOrdenFaqGuardado() {
  if (typeof localStorage === 'undefined') return

  const guardado = localStorage.getItem(FAQ_ORDEN_STORAGE_KEY)

  if (!guardado) return

  const ordenes = JSON.parse(guardado) as Record<string, string[]>

  Object.values(ordenes).forEach((ids) => {
    ids.forEach((id, indice) => {
      const pregunta = PREGUNTAS_FAQ_MOCK.find((item) => item.id === id)

      if (pregunta) {
        pregunta.orden = indice + 1
      }
    })
  })
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

function ordenarPorIngresoDescendente(a: Acceso, b: Acceso): number {
  const diferencia = new Date(b.ingresoEn).getTime() - new Date(a.ingresoEn).getTime()
  return diferencia !== 0 ? diferencia : a.id.localeCompare(b.id)
}

const ADMIN_EN_SESION = 'adm-001'

function bloqueaDesactivacion(cuenta: CuentaAdmin, motivo: string) {
  if (cuenta.id === ADMIN_EN_SESION) {
    return {
      mensaje: 'No puedes desactivar la cuenta con la que iniciaste sesion.',
      regla: 'E2',
    }
  }

  if (cuenta.reservaActiva) {
    return {
      mensaje: 'La cuenta tiene una reserva de plaza activa.',
      regla: 'E3',
    }
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

function nombreAdminEnSesion() {
  return sesionAdmin.nombre
}

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

  // RFA05: listado de reservas activas.
  http.get('/api/reservas', ({ request }) => {
    const url = new URL(request.url)
    const cocheraId = url.searchParams.get('cocheraId')
    const estado = url.searchParams.get('estado')

    const items = RESERVAS_MOCK.filter((reserva) => {
      const coincideCochera = !cocheraId || reserva.cocheraId === cocheraId
      const coincideEstado = !estado || reserva.estado === estado

      return coincideCochera && coincideEstado
    })

    return HttpResponse.json({ items })
  }),

  http.post('/api/reservas/:id/cancelar', async ({ params, request }) => {
    const { id } = params
    const { motivo } = (await request.json()) as { motivo?: string }

    const reserva = RESERVAS_MOCK.find((item) => item.id === id)

    if (!reserva || reserva.estado !== 'ACTIVA') {
      return HttpResponse.json(
        {
          message: 'La reserva ya no esta activa.',
          codigo: 'RESERVA_NO_ACTIVA',
        },
        { status: 409 },
      )
    }

    if (!motivo || motivo.trim().length < 10) {
      return HttpResponse.json(
        {
          message: 'El motivo es obligatorio.',
          codigo: 'MOTIVO_INVALIDO',
        },
        { status: 400 },
      )
    }

    reserva.estado = 'CANCELADA_POR_ADMIN'

    return HttpResponse.json(reserva)
  }),

  // RFA01: lista paginada de usuarios con filtros server-side.
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

    const { pagina, pageSize, total } = paginaDesde(request, filtrados.length)
    const items = filtrados.slice((pagina - 1) * pageSize, pagina * pageSize)

    return HttpResponse.json<Pagina<Usuario>>({
      items,
      total,
      pagina,
      pageSize,
    })
  }),

  http.get('/api/usuarios/:id', ({ params }) => {
    const encontrado = usuarioDe(params)

    if ('fallo' in encontrado) {
      return encontrado.fallo
    }

    return HttpResponse.json(detalleDe(encontrado.usuario, encontrado.indice))
  }),

  http.get('/api/usuarios/:id/accesos', ({ params, request }) => {
    const encontrado = usuarioDe(params)

    if ('fallo' in encontrado) {
      return encontrado.fallo
    }

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

    if ('fallo' in encontrado) {
      return encontrado.fallo
    }

    const todos: Reserva[] = reservasDe(encontrado.usuario, encontrado.indice)

    const { pagina, pageSize, total } = paginaDesde(request, todos.length)

    return HttpResponse.json<Pagina<Reserva>>({
      items: todos.slice((pagina - 1) * pageSize, pagina * pageSize),
      total,
      pagina,
      pageSize,
    })
  }),

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

  http.get('/api/cuentas-admin', () =>
    HttpResponse.json({
      items: cuentasAdmin.items.map(comoSeVe),
    }),
  ),

  http.post('/api/cuentas-admin', async ({ request }) => {
    const cuerpo = (await request.json()) as Partial<CuentaAdmin> & {
      contrasena?: string
    }

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

  // RFA08: contenido de preguntas frecuentes.
  http.get('/api/faq', () => {
    aplicarOrdenFaqGuardado()

    return HttpResponse.json({
      categorias: CATEGORIAS_FAQ_MOCK,
      preguntas: PREGUNTAS_FAQ_MOCK,
    })
  }),

  http.post('/api/faq/categorias', async ({ request }) => {
    const { nombre } = (await request.json()) as { nombre?: string }

    if (!nombre?.trim()) {
      return HttpResponse.json(
        {
          message: 'El nombre de la categoria es obligatorio.',
          codigo: 'NOMBRE_REQUERIDO',
        },
        { status: 400 },
      )
    }

    const nuevaCategoria = {
      id: `cat-${String(CATEGORIAS_FAQ_MOCK.length + 1).padStart(2, '0')}`,
      nombre: nombre.trim(),
      orden: CATEGORIAS_FAQ_MOCK.length + 1,
    }

    CATEGORIAS_FAQ_MOCK.push(nuevaCategoria)

    return HttpResponse.json(nuevaCategoria, { status: 201 })
  }),

  http.patch('/api/faq/categorias/:id', async ({ params, request }) => {
    const { id } = params
    const { nombre } = (await request.json()) as { nombre?: string }

    const categoria = CATEGORIAS_FAQ_MOCK.find((item) => item.id === id)

    if (!categoria) {
      return HttpResponse.json(
        {
          message: 'La categoria no existe.',
          codigo: 'CATEGORIA_NO_ENCONTRADA',
        },
        { status: 404 },
      )
    }

    if (!nombre?.trim()) {
      return HttpResponse.json(
        {
          message: 'El nombre de la categoria es obligatorio.',
          codigo: 'NOMBRE_REQUERIDO',
        },
        { status: 400 },
      )
    }

    categoria.nombre = nombre.trim()

    return HttpResponse.json(categoria)
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
    const cuerpo = (await request.json()) as Partial<CuentaAdmin> & {
      motivo?: string
    }

    const cambio: Partial<CuentaAdmin> = {}
    let accion = 'EDITAR_CUENTA'

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
            {
              message: bloqueo.mensaje,
              codigo: bloqueo.regla,
            },
            { status: 409 },
          )
        }
      }

      cambio.estado = cuerpo.estado
      accion = cuerpo.estado === 'BLOQUEADO' ? 'DESACTIVAR_CUENTA' : 'REACTIVAR_CUENTA'
    }

    if (Object.keys(cambio).length === 0) {
      return HttpResponse.json(comoSeVe(cuenta))
    }

    cuentasAdmin.items[indice] = {
      ...cuenta,
      ...cambio,
    }

    registrarAuditoria({
      adminId: ADMIN_EN_SESION,
      adminNombre: nombreAdminEnSesion(),
      accion,
      elemento: cuenta.correo,
      ...(cambio.estado === 'BLOQUEADO' ? { motivo: cuerpo.motivo } : {}),
    })

    return HttpResponse.json(comoSeVe(cuentasAdmin.items[indice]))
  }),

  http.delete('/api/faq/categorias/:id', ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const motivo = url.searchParams.get('motivo')

    const indice = CATEGORIAS_FAQ_MOCK.findIndex((item) => item.id === id)

    if (indice === -1) {
      return HttpResponse.json(
        {
          message: 'La categoria no existe.',
          codigo: 'CATEGORIA_NO_ENCONTRADA',
        },
        { status: 404 },
      )
    }

    if (!motivo || motivo.trim().length < 10) {
      return HttpResponse.json(
        {
          message: 'El motivo es obligatorio.',
          codigo: 'MOTIVO_INVALIDO',
        },
        { status: 400 },
      )
    }

    CATEGORIAS_FAQ_MOCK.splice(indice, 1)

    for (let i = PREGUNTAS_FAQ_MOCK.length - 1; i >= 0; i -= 1) {
      if (PREGUNTAS_FAQ_MOCK[i].categoriaId === id) {
        PREGUNTAS_FAQ_MOCK.splice(i, 1)
      }
    }

    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/faq/preguntas', async ({ request }) => {
    const { categoriaId, pregunta, respuesta } = (await request.json()) as {
      categoriaId?: string
      pregunta?: string
      respuesta?: string
    }

    if (!categoriaId || !CATEGORIAS_FAQ_MOCK.some((categoria) => categoria.id === categoriaId)) {
      return HttpResponse.json(
        {
          message: 'La categoria seleccionada no existe.',
          codigo: 'CATEGORIA_INVALIDA',
        },
        { status: 400 },
      )
    }

    if (!pregunta?.trim() || !respuesta?.trim()) {
      return HttpResponse.json(
        {
          message: 'La pregunta y la respuesta son obligatorias.',
          codigo: 'DATOS_INCOMPLETOS',
        },
        { status: 400 },
      )
    }

    const preguntasCategoria = PREGUNTAS_FAQ_MOCK.filter((item) => item.categoriaId === categoriaId)

    const nuevaPregunta = {
      id: `faq-${String(PREGUNTAS_FAQ_MOCK.length + 1).padStart(2, '0')}`,
      categoriaId,
      pregunta: pregunta.trim(),
      respuesta: respuesta.trim(),
      orden: preguntasCategoria.length + 1,
    }

    PREGUNTAS_FAQ_MOCK.push(nuevaPregunta)

    return HttpResponse.json(nuevaPregunta, {
      status: 201,
    })
  }),

  http.patch('/api/faq/preguntas/orden', async ({ request }) => {
    const { ids } = (await request.json()) as {
      ids?: string[]
    }

    if (!ids || ids.length === 0) {
      return HttpResponse.json(
        {
          message: 'Debes enviar al menos una pregunta.',
          codigo: 'ORDEN_INVALIDO',
        },
        { status: 400 },
      )
    }

    ids.forEach((id, indice) => {
      const pregunta = PREGUNTAS_FAQ_MOCK.find((item) => item.id === id)

      if (pregunta) {
        pregunta.orden = indice + 1
      }
    })

    const primeraPregunta = PREGUNTAS_FAQ_MOCK.find((item) => item.id === ids[0])

    if (primeraPregunta) {
      guardarOrdenFaq(primeraPregunta.categoriaId, ids)
    }

    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/faq/preguntas/:id', async ({ params, request }) => {
    const { id } = params

    const { categoriaId, pregunta, respuesta } = (await request.json()) as {
      categoriaId?: string
      pregunta?: string
      respuesta?: string
    }

    const existente = PREGUNTAS_FAQ_MOCK.find((item) => item.id === id)

    if (!existente) {
      return HttpResponse.json(
        {
          message: 'La pregunta no existe.',
          codigo: 'PREGUNTA_NO_ENCONTRADA',
        },
        { status: 404 },
      )
    }

    if (!categoriaId || !CATEGORIAS_FAQ_MOCK.some((categoria) => categoria.id === categoriaId)) {
      return HttpResponse.json(
        {
          message: 'La categoria seleccionada no existe.',
          codigo: 'CATEGORIA_INVALIDA',
        },
        { status: 400 },
      )
    }

    if (!pregunta?.trim() || !respuesta?.trim()) {
      return HttpResponse.json(
        {
          message: 'La pregunta y la respuesta son obligatorias.',
          codigo: 'DATOS_INCOMPLETOS',
        },
        { status: 400 },
      )
    }

    existente.categoriaId = categoriaId
    existente.pregunta = pregunta.trim()
    existente.respuesta = respuesta.trim()

    return HttpResponse.json(existente)
  }),

  http.delete('/api/faq/preguntas/:id', ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const motivo = url.searchParams.get('motivo')

    const indice = PREGUNTAS_FAQ_MOCK.findIndex((item) => item.id === id)

    if (indice === -1) {
      return HttpResponse.json(
        {
          message: 'La pregunta no existe.',
          codigo: 'PREGUNTA_NO_ENCONTRADA',
        },
        { status: 404 },
      )
    }

    if (!motivo || motivo.trim().length < 10) {
      return HttpResponse.json(
        {
          message: 'El motivo es obligatorio.',
          codigo: 'MOTIVO_INVALIDO',
        },
        { status: 400 },
      )
    }

    PREGUNTAS_FAQ_MOCK.splice(indice, 1)

    return new HttpResponse(null, { status: 204 })
  }),

  // RFA10: audit log de solo lectura con filtros.
  http.get('/api/auditoria', ({ request }) => {
    const url = new URL(request.url)

    const adminId = url.searchParams.get('adminId')
    const accion = url.searchParams.get('accion')
    const elemento = url.searchParams.get('elemento')
    const desde = url.searchParams.get('desde')
    const hasta = url.searchParams.get('hasta')

    const items = auditoria.items.filter((entrada) => {
      const coincideAdmin = !adminId || entrada.adminId === adminId

      const coincideAccion = !accion || entrada.accion === accion

      const coincideElemento =
        !elemento || entrada.elemento.toLowerCase().includes(elemento.toLowerCase())

      const fecha = new Date(entrada.ocurridoEn).getTime()

      const coincideDesde = !desde || fecha >= new Date(`${desde}T00:00:00`).getTime()

      const coincideHasta = !hasta || fecha <= new Date(`${hasta}T23:59:59.999`).getTime()

      return coincideAdmin && coincideAccion && coincideElemento && coincideDesde && coincideHasta
    })

    return HttpResponse.json({ items })
  }),
]
