import { useCallback, useSyncExternalStore } from 'react'

/**
 * Media query como hook. Lo usa el sidebar para decidir si esta en modo
 * drawer (movil) o fijo (escritorio) en vez de duplicar el breakpoint en CSS
 * y en JavaScript.
 *
 * Se implementa con `useSyncExternalStore` y no con estado local mas un
 * efecto, porque `matchMedia` es un store externo: la API de React esta hecha
 * para esto y resuelve sola los dos problemas del caso ingenuo, que son el
 * valor inicial desactualizado (flash de movil antes del efecto) y la
 * suscripcion que se pierde al cambiar el breakpoint.
 *
 * El tercer argumento es el snapshot para SSR: en un render estatico no hay
 * `window`, y por defecto se asume escritorio, que es el caso del panel.
 */
export function useMediaQuery(query: string): boolean {
  const suscribir = useCallback(
    (alCambiar: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', alCambiar)
      return () => mql.removeEventListener('change', alCambiar)
    },
    [query],
  )

  const obtener = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(suscribir, obtener, () => false)
}

/** `lg` de Tailwind. El sidebar cambia de fijo a drawer en este punto. */
export const BREAKPOINT_LG = '(min-width: 1024px)'
