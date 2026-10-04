import { io, type Socket } from 'socket.io-client'
import type {
  AlertaSinSenalPayload,
  SensorActualizadoPayload,
} from '@/features/sensores/types/sensor.types'
import type { EventoPlazaCambiada } from '@/features/monitor/types/plaza.types'

/** Eventos que emite el servidor. Se amplia cuando otros modulos usen el socket. */
interface EventosServidor {
  'sensor:actualizado': (payload: SensorActualizadoPayload) => void
  'sensor:alerta_sin_senal': (payload: AlertaSinSenalPayload) => void
  'plaza:estado_cambiado': (payload: EventoPlazaCambiada) => void
}

const URL_WS = import.meta.env.VITE_SOCKET_URL ?? 'ws://localhost:5173/socket.io'

/**
 * Instancia unica del cliente. `autoConnect: false`: quien la use decide cuando
 * conectar (useSensores conecta al montar y desconecta al desmontar).
 */
export const socket: Socket<EventosServidor> = io(URL_WS, {
  autoConnect: false,
  reconnectionAttempts: 5,
})
