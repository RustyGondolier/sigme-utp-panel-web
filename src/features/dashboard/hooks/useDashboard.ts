import { useCallback, useMemo, useState } from 'react'
import { MOCK_PLAZAS } from '@/features/monitor/mocks/plazas.mock'
import { MOCK_SENSORES } from '@/features/sensores/mocks/sensores.mock'
import type { Plaza } from '@/features/monitor/types/plaza.types'
import type { Sensor } from '@/features/sensores/types/sensor.types'
import {
  calcularKPIs,
  calcularOcupacionSotanos,
  calcularResumenSensores,
} from '../dashboard.calculos'
import { MOCK_ALERTAS_DASHBOARD } from '../data/dashboard.mocks'
import type { AlertaDashboard } from '../types/dashboard.types'

/**
 * Metricas globales del dashboard (RFA11, etapa 1).
 *
 * Plazas y sensores parten de los mocks de RFA03 y RFA04 y los KPIs se derivan
 * de ellos, asi nunca se desincronizan. Puntos de extension:
 * - API: reemplazar los estados iniciales por useQuery.
 * - WebSocket: actualizar `plazas` y `sensores` desde los mismos eventos que
 *   usan usePlazas y useSensores; los KPIs se recalculan solos.
 */
export function useDashboard() {
  const [plazas] = useState<Plaza[]>(MOCK_PLAZAS)
  const [sensores] = useState<Sensor[]>(MOCK_SENSORES)
  const [alertas, setAlertas] = useState<AlertaDashboard[]>(MOCK_ALERTAS_DASHBOARD)
  // Sin carga real todavía; pasará a ser `consulta.isLoading` al conectar la API.
  const [isLoading] = useState(false)

  const kpis = useMemo(() => calcularKPIs(plazas), [plazas])
  const resumenSensores = useMemo(() => calcularResumenSensores(sensores), [sensores])
  const ocupacionSotanos = useMemo(() => calcularOcupacionSotanos(plazas), [plazas])

  const descartarAlerta = useCallback((id: string) => {
    setAlertas((actuales) => actuales.filter((a) => a.id !== id))
  }, [])

  return {
    isLoading,
    kpis,
    resumenSensores,
    ocupacionSotanos,
    alertas,
    descartarAlerta,
  }
}
