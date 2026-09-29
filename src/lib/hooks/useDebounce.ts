import { useEffect, useState } from 'react'

/**
 * Retrasa la propagacion de un valor. Lo usan los filtros de texto de las
 * tablas (RFA01, RFA07, RFA10): sin esto se dispara una consulta por tecla.
 */
export function useDebounce<T>(valor: T, ms = 350): T {
  const [diferido, setDiferido] = useState(valor)

  useEffect(() => {
    const t = setTimeout(() => setDiferido(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])

  return diferido
}
