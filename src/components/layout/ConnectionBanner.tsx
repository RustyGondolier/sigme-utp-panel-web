import { CloudOff } from 'lucide-react'
import { mensajeConexion, useConexion } from '@/lib/conexion'

/**
 * Aviso persistente de falta de conexion (RNF06).
 *
 * Va en el header y no en cada vista: si la API cae, el problema es global, y
 * repetir el aviso en 9 pantallas seria nueve fuentes de verdad.
 *
 * El texto usa `role="status"` (y no `alert`) a proposito: no interrumpe al
 * administrador de lo que esta haciendo, solo lo informa. Un `alert` por cada
 * reintento fallido haria la pantalla inservible durante una caida.
 */
export function ConnectionBanner() {
  const conectado = useConexion((e) => e.conectado)
  const ultimoFallo = useConexion((e) => e.ultimoFallo)
  const mensaje = mensajeConexion(conectado, ultimoFallo)

  if (!mensaje) return null

  return (
    <div
      role="status"
      data-conexion="sin-conexion"
      className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800 sm:px-6 lg:px-8"
    >
      <CloudOff className="size-3.5 shrink-0" aria-hidden="true" />
      {mensaje}
    </div>
  )
}
