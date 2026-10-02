import { http, HttpResponse } from 'msw'
import type { Sesion } from '@/lib/types/dominio'
import {
  AUDITORIA_MOCK,
  CATEGORIAS_FAQ_MOCK,
  COCHERA_PRINCIPAL,
  PLAZAS_MOCK,
  PREGUNTAS_FAQ_MOCK,
  RESERVAS_MOCK,
  SENSORES_MOCK,
} from '@/mocks/fixtures'

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

export const handlers = [
  // RFA09: login. El limite de 5 intentos (RNF07) lo lleva el servidor; aca se
  // simula solo el caso de exito y el de credenciales invalidas.
  http.post('/api/auth/login', async ({ request }) => {
    const { usuario, contrasena } = (await request.json()) as {
      usuario?: string
      contrasena?: string
    }

    if (usuario === 'admin' && contrasena === 'utp2026') {
      return HttpResponse.json(sesionAdmin)
    }

    return HttpResponse.json(
      {
        message: 'Usuario o contrasena incorrectos',
        codigo: 'CREDENCIALES_INVALIDAS',
      },
      { status: 401 },
    )
  }),

  http.get('/api/auth/sesion', () => HttpResponse.json(sesionAdmin)),

  http.get('/api/overview', () => {
    const libres = PLAZAS_MOCK.filter((p) => p.estado === 'LIBRE').length
    const online = SENSORES_MOCK.filter((s) => s.estado === 'ACTIVO').length

    return HttpResponse.json({
      totalPlazas: COCHERA_PRINCIPAL.totalPlazas,
      plazasLibres: libres,
      ocupacionPorcentaje: 38.3,
      reservasActivas: 12,
      sensoresOnline: online,
      sensoresTotal: SENSORES_MOCK.length,
      servidorDisponible: true,
      ultimaActualizacion: new Date().toISOString(),
    })
  }),

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

  // RFA08: contenido de preguntas frecuentes.
  http.get('/api/faq', () => {
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

    return HttpResponse.json(nuevaPregunta, { status: 201 })
  }),

  http.patch('/api/faq/preguntas/orden', async ({ request }) => {
    const { ids } = (await request.json()) as { ids?: string[] }

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

    const items = AUDITORIA_MOCK.filter((entrada) => {
      const coincideAdmin = !adminId || entrada.adminId === adminId
      const coincideAccion = !accion || entrada.accion === accion
      const coincideElemento =
        !elemento || entrada.elemento.toLowerCase().includes(elemento.toLowerCase())

      const fecha = new Date(entrada.ocurridoEn).getTime()
      const coincideDesde = !desde || fecha >= new Date(desde).getTime()
      const coincideHasta = !hasta || fecha <= new Date(hasta).getTime()

      return coincideAdmin && coincideAccion && coincideElemento && coincideDesde && coincideHasta
    })

    return HttpResponse.json({ items })
  }),
]
