import { createContext, useContext } from 'react'

/**
 * Contexto de avisos, separado del provider para que `Avisos.tsx` exporte solo
 * componentes (si no, React no puede hacer fast refresh del archivo).
 *
 * El `throw` es explicito: un `useAvisos` fuera del provider debe fallar
 * ruidosamente en desarrollo, no devolver `undefined` y romper mas abajo con un
 * error que no senala la causa.
 */

export type Tono = 'exito' | 'error' | 'info'

export interface Aviso {
  id: number
  tono: Tono
  texto: string
}

export interface ContextoAvisos {
  avisar: (tono: Tono, texto: string) => void
  /** Cierra un aviso por id. Lo usa el boton de cerrar. */
  cerrar: (id: number) => void
}

export const AvisosContext = createContext<ContextoAvisos | null>(null)

export function useAvisos(): ContextoAvisos {
  const ctx = useContext(AvisosContext)
  if (!ctx) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>')
  return ctx
}
