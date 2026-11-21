import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { socket } from '@/lib/socket'
import { MOCK_PLAZAS } from '@/features/monitor/mocks/plazas.mock'
import { MOCK_SENSORES } from '@/features/sensores/mocks/sensores.mock'
import type { EventoPlazaCambiada, Plaza } from '@/features/monitor/types/plaza.types'
import type {
  AlertaSinSenalPayload,
  EstadoConexion,
  Sensor,
  SensorActualizadoPayload,
} from '@/features/sensores/types/sensor.types'
import {
  calcularKPIs,
  calcularOcupacionSotanos,
  calcularResumenSensores,
} from '../dashboard.calculos'
import { MOCK_ALERTAS_DASHBOARD } from '../data/dashboard.mocks'
import type { AlertaDashboard, EventoSimuladoDashboard } from '../types/dashboard.types'
const MAX_ALERTAS = 50

/** Misma regla que `actualizarPlaza` de usePlazas: ignora OCUPADA/RESERVADA sin ocupante. */
function aplicarEventoPlaza(plaza: Plaza, { estado, ocupante }: EventoPlazaCambiada): Plaza {
  const siguiente: Plaza = { ...plaza, estado, ...(ocupante ? { ocupante } : {}) }
  if (estado === 'LIBRE' || estado === 'FUERA_DE_SERVICIO') {
    delete siguiente.ocupante
  } else if (siguiente.ocupante === undefined) {
    return plaza
  }
  return siguiente
}

/** Un id por sensor y tipo: si se repite, reemplaza a la alerta anterior. */
function crearAlertaSensor(
  estado: 'SIN_SEÑAL' | 'INACTIVO',
  sensorId: string,
  codigo: string,
  plazaId?: string,
): AlertaDashboard {
  const detalle = plazaId ? `${codigo} (plaza ${plazaId})` : codigo
  const sinSenal = estado === 'SIN_SEÑAL'
  return {
    id: `sensor-${estado}-${sensorId}`,
    modulo: 'SENSORES',
    titulo: sinSenal ? 'Sensor sin señal' : 'Sensor inactivo',
    mensaje: sinSenal ? `${detalle} dejó de reportar.` : `${detalle} pasó a estado inactivo.`,
    nivel: sinSenal ? 'CRITICO' : 'ADVERTENCIA',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Metricas globales del dashboard (RFA11).
 *
 * Plazas y sensores parten de los mocks de RFA03 y RFA04 y los KPIs se derivan
 * de ellos. Etapa 3: el socket actualiza ambos listados en vivo (los KPIs se
 * recalculan solos) y genera alertas cuando un sensor queda sin señal o inactivo.
 * Punto de extension pendiente: reemplazar los estados iniciales por useQuery.
 */
export function useDashboard() {
  const [plazas, setPlazas] = useState<Plaza[]>(MOCK_PLAZAS)
  const [sensores, setSensores] = useState<Sensor[]>(MOCK_SENSORES)
  const [alertas, setAlertas] = useState<AlertaDashboard[]>(MOCK_ALERTAS_DASHBOARD)
  // Sin carga real todavía; pasará a ser `consulta.isLoading` al conectar la API.
  const [isLoading] = useState(false)
  const [estadoSocket, setEstadoSocket] = useState<EstadoConexion>('DESCONECTADO')

  const kpis = useMemo(() => calcularKPIs(plazas), [plazas])
  const resumenSensores = useMemo(() => calcularResumenSensores(sensores), [sensores])
  const ocupacionSotanos = useMemo(() => calcularOcupacionSotanos(plazas), [plazas])

  const descartarAlerta = useCallback((id: string) => {
    setAlertas((actuales) => actuales.filter((a) => a.id !== id))
  }, [])

  const agregarAlerta = useCallback((alerta: AlertaDashboard) => {
    // Va al tope del feed; si ya había una con el mismo id, se reemplaza.
    setAlertas((actuales) =>
      [alerta, ...actuales.filter((a) => a.id !== alerta.id)].slice(0, MAX_ALERTAS),
    )
  }, [])

  // Copia de sensores para que los listeners lean el estado previo sin re-suscribirse.
  const sensoresRef = useRef(sensores)
  useEffect(() => {
    sensoresRef.current = sensores
  }, [sensores])

  useEffect(() => {
    function alCambiarPlaza(payload: EventoPlazaCambiada) {
      setPlazas((actuales) =>
        actuales.map((p) => (p.id === payload.id ? aplicarEventoPlaza(p, payload) : p)),
      )
    }

    function alActualizarSensor(payload: SensorActualizadoPayload) {
      const { id, ...cambios } = payload
      const previo = sensoresRef.current.find((s) => s.id === id)
      if (previo === undefined) return

      setSensores((actuales) => actuales.map((s) => (s.id === id ? { ...s, ...cambios } : s)))

      const nuevo = cambios.estado
      if (
        nuevo !== undefined &&
        nuevo !== previo.estado &&
        (nuevo === 'SIN_SEÑAL' || nuevo === 'INACTIVO')
      ) {
        agregarAlerta(crearAlertaSensor(nuevo, id, previo.codigo, previo.plazaId))
      }
    }

    function alAlertaSinSenal(payload: AlertaSinSenalPayload) {
      const { id, ultimaEmision } = payload
      const sensor = sensoresRef.current.find((s) => s.id === id)
      const codigo = sensor?.codigo ?? payload.codigo
      if (codigo === undefined) return // Sin datos para describir la alerta.

      setSensores((actuales) =>
        actuales.map((s) =>
          s.id === id
            ? { ...s, estado: 'SIN_SEÑAL', ultimaEmision: ultimaEmision ?? s.ultimaEmision }
            : s,
        ),
      )
      agregarAlerta(crearAlertaSensor('SIN_SEÑAL', id, codigo, sensor?.plazaId ?? payload.plazaId))
    }

    const alConectar = () => setEstadoSocket('CONECTADO')
    const alDesconectar = () => setEstadoSocket('DESCONECTADO')
    const alFallar = () => setEstadoSocket('REINTENTANDO')
    const alAgotarIntentos = () => setEstadoSocket('DESCONECTADO')

    socket.on('plaza:estado_cambiado', alCambiarPlaza)
    socket.on('sensor:actualizado', alActualizarSensor)
    socket.on('sensor:alerta_sin_senal', alAlertaSinSenal)
    socket.on('connect', alConectar)
    socket.on('disconnect', alDesconectar)
    socket.on('connect_error', alFallar)
    socket.io.on('reconnect_attempt', alFallar)
    socket.io.on('reconnect_failed', alAgotarIntentos)
    socket.connect()

    return () => {
      socket.off('plaza:estado_cambiado', alCambiarPlaza)
      socket.off('sensor:actualizado', alActualizarSensor)
      socket.off('sensor:alerta_sin_senal', alAlertaSinSenal)
      socket.off('connect', alConectar)
      socket.off('disconnect', alDesconectar)
      socket.off('connect_error', alFallar)
      socket.io.off('reconnect_attempt', alFallar)
      socket.io.off('reconnect_failed', alAgotarIntentos)
      socket.disconnect()
    }
  }, [agregarAlerta])

  /**
   * Solo desarrollo: entrega un evento a los listeners ya registrados en el
   * socket, como si lo hubiera emitido el servidor. En produccion no hace nada.
   */
  const simularEvento = useCallback((evento: EventoSimuladoDashboard) => {
    if (!import.meta.env.DEV) return
    switch (evento.tipo) {
      case 'plaza:estado_cambiado':
        socket.listeners('plaza:estado_cambiado').forEach((fn) => fn(evento.payload))
        break
      case 'sensor:actualizado':
        socket.listeners('sensor:actualizado').forEach((fn) => fn(evento.payload))
        break
      case 'sensor:alerta_sin_senal':
        socket.listeners('sensor:alerta_sin_senal').forEach((fn) => fn(evento.payload))
        break
    }
  }, [])

  return {
    isLoading,
    estadoSocket,
    plazas,
    sensores,
    simularEvento,
    kpis,
    resumenSensores,
    ocupacionSotanos,
    alertas,
    descartarAlerta,
  }
}
