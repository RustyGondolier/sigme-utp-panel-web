import { useCallback, useEffect, useRef, useState } from 'react'
import { socket } from '@/lib/socket'
import { MOCK_SENSORES } from '../mocks/sensores.mock'
import type {
  ActualizarSensorDTO,
  AlertaSensor,
  AlertaSinSenalPayload,
  CrearSensorDTO,
  EstadoConexion,
  EstadoSensor,
  EventoSimulado,
  Sensor,
  SensorActualizadoPayload,
} from '../types/sensor.types'

/**
 * Estado local de sensores (RFA04, etapa 1).
 *
 * Todo opera en memoria sobre MOCK_SENSORES. Puntos de extensión:
 * - API: reemplazar el estado inicial por useQuery y las mutaciones por useMutation.
 * - WebSocket: actualizar `setSensores` desde un listener de socket.io-client.
 */
export function useSensores() {
  const [sensores, setSensores] = useState<Sensor[]>(MOCK_SENSORES)
  // Sin carga real todavía; pasará a ser `consulta.isLoading` al conectar la API.
  const [isLoading] = useState(false)
  const [alertas, setAlertas] = useState<AlertaSensor[]>([])
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexion>('DESCONECTADO')

  // Copia del listado para que los listeners lean el estado previo sin re-suscribirse.
  const sensoresRef = useRef(sensores)
  useEffect(() => {
    sensoresRef.current = sensores
  }, [sensores])

  const registrarAlerta = useCallback((id: string, respaldo?: AlertaSinSenalPayload) => {
    const sensor = sensoresRef.current.find((s) => s.id === id)
    const codigo = sensor?.codigo ?? respaldo?.codigo
    if (!codigo) return
    const plazaId = sensor?.plazaId ?? respaldo?.plazaId ?? '—'
    // Una alerta por sensor: si ya existía, se reemplaza y sube al tope.
    setAlertas((actuales) => [
      { sensorId: id, codigo, plazaId },
      ...actuales.filter((a) => a.sensorId !== id),
    ])
  }, [])

  const descartarAlerta = useCallback((sensorId: string) => {
    setAlertas((actuales) => actuales.filter((a) => a.sensorId !== sensorId))
  }, [])

  useEffect(() => {
    function alActualizar(payload: SensorActualizadoPayload) {
      const { id, ...cambios } = payload
      const previo = sensoresRef.current.find((s) => s.id === id)
      if (previo === undefined) return

      setSensores((actuales) => actuales.map((s) => (s.id === id ? { ...s, ...cambios } : s)))
      if (cambios.estado === 'SIN_SEÑAL' && previo.estado !== 'SIN_SEÑAL') registrarAlerta(id)
    }

    function alAlertaSinSenal(payload: AlertaSinSenalPayload) {
      const { id, ultimaEmision } = payload
      setSensores((actuales) =>
        actuales.map((s) =>
          s.id === id
            ? { ...s, estado: 'SIN_SEÑAL', ultimaEmision: ultimaEmision ?? s.ultimaEmision }
            : s,
        ),
      )
      registrarAlerta(id, payload)
    }

    const alConectar = () => setEstadoConexion('CONECTADO')
    const alDesconectar = () => setEstadoConexion('DESCONECTADO')
    const alFallar = () => setEstadoConexion('REINTENTANDO')
    const alAgotarIntentos = () => setEstadoConexion('DESCONECTADO')

    socket.on('sensor:actualizado', alActualizar)
    socket.on('sensor:alerta_sin_senal', alAlertaSinSenal)
    socket.on('connect', alConectar)
    socket.on('disconnect', alDesconectar)
    socket.on('connect_error', alFallar)
    socket.io.on('reconnect_attempt', alFallar)
    socket.io.on('reconnect_failed', alAgotarIntentos)
    socket.connect()

    return () => {
      socket.off('sensor:actualizado', alActualizar)
      socket.off('sensor:alerta_sin_senal', alAlertaSinSenal)
      socket.off('connect', alConectar)
      socket.off('disconnect', alDesconectar)
      socket.off('connect_error', alFallar)
      socket.io.off('reconnect_attempt', alFallar)
      socket.io.off('reconnect_failed', alAgotarIntentos)
      socket.disconnect()
    }
  }, [registrarAlerta])

  /**
   * Solo desarrollo: entrega un evento a los listeners ya registrados en el
   * socket, como si lo hubiera emitido el servidor. En produccion no hace nada.
   */
  const simularEvento = useCallback((evento: EventoSimulado) => {
    if (!import.meta.env.DEV) return
    if (evento.tipo === 'sensor:actualizado') {
      socket.listeners('sensor:actualizado').forEach((fn) => fn(evento.payload))
    } else {
      socket.listeners('sensor:alerta_sin_senal').forEach((fn) => fn(evento.payload))
    }
  }, [])

  const agregarSensor = useCallback((datos: CrearSensorDTO): Sensor => {
    const nuevo: Sensor = {
      ...datos,
      id: crypto.randomUUID(),
      estado: 'INACTIVO',
      ultimaEmision: null,
    }
    setSensores((actuales) => [nuevo, ...actuales])
    return nuevo
  }, [])

  const actualizarEstadoSensor = useCallback((id: string, estado: EstadoSensor) => {
    setSensores((actuales) => actuales.map((s) => (s.id === id ? { ...s, estado } : s)))
  }, [])

  const actualizarSensor = useCallback((id: string, datos: ActualizarSensorDTO) => {
    setSensores((actuales) => actuales.map((s) => (s.id === id ? { ...s, ...datos } : s)))
  }, [])

  const eliminarSensor = useCallback((id: string) => {
    setSensores((actuales) => actuales.filter((s) => s.id !== id))
  }, [])

  return {
    sensores,
    isLoading,
    alertas,
    descartarAlerta,
    estadoConexion,
    isConnected: estadoConexion === 'CONECTADO',
    simularEvento,
    agregarSensor,
    actualizarSensor,
    actualizarEstadoSensor,
    eliminarSensor,
  }
}
