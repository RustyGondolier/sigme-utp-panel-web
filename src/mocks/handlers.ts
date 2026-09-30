import { http, HttpResponse } from 'msw'
import type { Acceso, Pagina, Reserva, Sesion, Usuario } from '@/lib/types/dominio'
import {
  COCHERA_PRINCIPAL,
  PLAZAS_MOCK,
  SENSORES_MOCK,
  USUARIOS_MOCK,
  accesosDe,
  detalleDe,
  reservasDe,
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

/**
 * Recorta la pagina pedida al rango valido, como haria el backend real: la
 * vista manda `pagina` en base 1 y una pagina fuera de rango no debe devolver
 * items fantasma. Se comparte entre RFA01 y los historiales de RFA02 porque los
 * tres relies en el mismo `Pagina<T>`.
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
]
