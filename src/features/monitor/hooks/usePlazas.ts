import { useCallback, useMemo, useState } from 'react'
import { MOCK_PLAZAS } from '../mocks/plazas.mock'
import type { FiltrosPlaza, Plaza } from '../types/plaza.types'

/**
 * Estado local de plazas y filtros (RFA03, etapa 1).
 *
 * Opera en memoria sobre MOCK_PLAZAS. Puntos de extensión, igual que useSensores:
 * - API: reemplazar el estado inicial por useQuery.
 * - WebSocket: actualizar plazas con `actualizarPlaza` desde un listener del socket.
 */

export const FILTROS_INICIALES: FiltrosPlaza = {
  busqueda: '',
  sotano: 'TODOS',
  estado: 'TODOS',
}

/** Minutos enteros desde `iso` hasta `ahora` (nunca negativo). */
export function minutosDesde(iso: string, ahora: number = Date.now()): number {
  return Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60_000))
}

export function usePlazas() {
  const [plazas, setPlazas] = useState<Plaza[]>(MOCK_PLAZAS)
  // Sin carga real todavía; pasará a ser `consulta.isLoading` al conectar la API.
  const [isLoading] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosPlaza>(FILTROS_INICIALES)

  const sotanos = useMemo(() => [...new Set(plazas.map((p) => p.sotano))].sort(), [plazas])

  const plazasFiltradas = useMemo(() => {
    const termino = filtros.busqueda.trim().toLowerCase()
    return plazas.filter(
      (p) =>
        (filtros.sotano === 'TODOS' || p.sotano === filtros.sotano) &&
        (filtros.estado === 'TODOS' || p.estado === filtros.estado) &&
        (termino === '' ||
          [p.codigo, p.sensorCodigo, p.ocupante?.placa, p.ocupante?.usuario].some((v) =>
            v?.toLowerCase().includes(termino),
          )),
    )
  }, [plazas, filtros])

  const actualizarFiltros = useCallback((cambios: Partial<FiltrosPlaza>) => {
    setFiltros((actuales) => ({ ...actuales, ...cambios }))
  }, [])

  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_INICIALES), [])

  const obtenerPlaza = useCallback((id: string) => plazas.find((p) => p.id === id), [plazas])

  /**
   * Aplica cambios parciales a una plaza y mantiene la regla del modelo:
   * LIBRE y FUERA_DE_SERVICIO no llevan ocupante; OCUPADA y RESERVADA lo exigen
   * (si el cambio lo dejaría sin ocupante, se ignora).
   */
  const actualizarPlaza = useCallback((id: string, cambios: Partial<Omit<Plaza, 'id'>>) => {
    setPlazas((actuales) =>
      actuales.map((p) => {
        if (p.id !== id) return p
        const siguiente: Plaza = { ...p, ...cambios }
        if (siguiente.estado === 'LIBRE' || siguiente.estado === 'FUERA_DE_SERVICIO') {
          delete siguiente.ocupante
        } else if (siguiente.ocupante === undefined) {
          return p
        }
        return siguiente
      }),
    )
  }, [])

  return {
    plazas,
    plazasFiltradas,
    sotanos,
    isLoading,
    filtros,
    actualizarFiltros,
    limpiarFiltros,
    obtenerPlaza,
    actualizarPlaza,
  }
}
