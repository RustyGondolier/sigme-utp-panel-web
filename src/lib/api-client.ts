/**
 * Cliente HTTP del panel.
 *
 * Todo el trafico REST pasa por aqui. Cuando exista la API real solo se cambia
 * VITE_API_BASE_URL: ningun componente sabe si los datos vienen de MSW o del
 * servidor, por eso las vistas se escriben contra estas funciones y nunca
 * contra `fetch` directo.
 */

import { useConexion } from '@/lib/conexion'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  /** El backend puede devolver el codigo de negocio; RFA04 lo usa para E1. */
  readonly codigo?: string

  constructor(status: number, message: string, codigo?: string, opciones?: { cause?: unknown }) {
    super(message, opciones)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
  }
}

/** Se inyecta desde la feature de auth para no acoplarla a este modulo. */
let obtenerToken: () => string | null = () => null
let alExpirar: () => void = () => {}

export function configurarAuth(hooks: {
  obtenerToken: () => string | null
  alExpirar: () => void
}) {
  obtenerToken = hooks.obtenerToken
  alExpirar = hooks.alExpirar
}

type Opciones = Omit<RequestInit, 'body'> & { body?: unknown }

export async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { body, headers, ...resto } = opciones

  let respuesta: Response
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...resto,
      headers: {
        'Content-Type': 'application/json',
        ...(obtenerToken() ? { Authorization: `Bearer ${obtenerToken()}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // Error de red (API caida, sin internet, CORS). RNF06 pide un aviso
    // persistente, no un error por vista.
    useConexion.getState().marcarFallo()
    throw new ApiError(0, 'No hay conexion con el servidor', undefined, { cause: error })
  }

  useConexion.getState().marcarConectado()

  // RNF05: 401 significa token invalido, revocado o expirado. Se avisa a la
  // sesion para que limpie y el guard redirija a /login.
  if (respuesta.status === 401) {
    alExpirar()
    throw new ApiError(401, 'Sesion expirada')
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null)
    throw new ApiError(
      respuesta.status,
      cuerpo?.message ?? `Error ${respuesta.status}`,
      cuerpo?.codigo,
    )
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

export const get = <T>(ruta: string) => api<T>(ruta)
export const post = <T>(ruta: string, body?: unknown) => api<T>(ruta, { method: 'POST', body })
export const patch = <T>(ruta: string, body?: unknown) => api<T>(ruta, { method: 'PATCH', body })
export const del = <T>(ruta: string) => api<T>(ruta, { method: 'DELETE' })

/** Construye un query string omitiendo los filtros vacios. */
export function query(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue
    q.set(clave, String(valor))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}
