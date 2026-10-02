import { http, HttpResponse } from 'msw'
import type { Sesion } from '@/lib/types/dominio'
import {
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
]
