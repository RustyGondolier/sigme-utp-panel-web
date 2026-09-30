import { create } from 'zustand'

/**
 * Estado de conexion con la API (RNF06).
 *
 * Vive aparte de `api-client` y en `lib` porque lo consumen dos capas: el
 * cliente HTTP escribe en el, y el layout lo lee. El cliente no importa al
 * layout, y el layout no intercepta `fetch`, asi que no hay ciclo.
 *
 * `ultimoFallo` guarda la hora del ultimo error de red para que el aviso
 * pueda decir "sin conexion desde hace 2 min" en vez de un parpadeo
 * indefinido.
 */
interface EstadoConexion {
  conectado: boolean
  ultimoFallo?: number
  marcarConectado: () => void
  marcarFallo: () => void
}

export const useConexion = create<EstadoConexion>()((set) => ({
  conectado: true,
  marcarConectado: () => set({ conectado: true }),
  marcarFallo: () => set({ conectado: false, ultimoFallo: Date.now() }),
}))

/** Texto del aviso, separado para poder testearlo sin renderizar. */
export function mensajeConexion(conectado: boolean, ultimoFallo?: number): string | null {
  if (conectado) return null
  if (!ultimoFallo) return 'Sin conexion con el servidor. Reintentando...'
  const minutos = Math.floor((Date.now() - ultimoFallo) / 60_000)
  if (minutos < 1) return 'Sin conexion con el servidor. Reintentando...'
  return `Sin conexion con el servidor desde hace ${minutos} min. Reintentando...`
}
