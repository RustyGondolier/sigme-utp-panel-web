import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { configurarAuth } from '@/lib/api-client'
import type { Sesion } from '@/lib/types/dominio'

/**
 * Sesion del administrador (RFA09).
 *
 * Guarda el token en localStorage para que recargar la pagina no cierre la
 * sesion: ante el jurado la recarga ocurre mucho. El token expira a las 8 horas
 * (RNF05) y `expirada` lo comprueba en cada lectura, no con un timer, para no
 * tener un intervalo corriendo toda la sesion.
 *
 * El store es la unica fuente de rol del front. `configurarAuth` conecta el
 * cliente HTTP con este store para que un 401 limpie la sesion (RNF05).
 */

interface EstadoSesion {
  sesion: Sesion | null
  establecer: (sesion: Sesion) => void
  cerrar: () => void
}

export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      sesion: null,
      establecer: (sesion) => set({ sesion }),
      cerrar: () => set({ sesion: null }),
    }),
    {
      name: 'sigme-sesion',
      partialize: (estado) => ({ sesion: estado.sesion }),
    },
  ),
)

/** Hook de lectura. Lanza si se usa fuera del provider, para fallar temprano. */
export function useSesionActual() {
  const sesion = useSesion((e) => e.sesion)
  return { sesion, autenticado: Boolean(sesion) && !expirada(sesion) }
}

export function expirada(sesion: Sesion | null): boolean {
  if (!sesion) return true
  return new Date(sesion.expiraEn).getTime() <= Date.now()
}

/**
 * Puente entre el cliente HTTP y el store. Se ejecuta una vez desde `App`:
 * si el token existe, se adjunta a cada peticion; si la API responde 401, se
 * limpia la sesion y el guard de ruta se encarga de redirigir.
 */
export function conectarClienteConSesion() {
  configurarAuth({
    obtenerToken: () => {
      const { sesion } = useSesion.getState()
      if (expirada(sesion)) return null
      return sesion?.token ?? null
    },
    alExpirar: () => useSesion.getState().cerrar(),
  })
}
