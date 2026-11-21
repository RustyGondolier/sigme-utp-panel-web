export type EstadoSensor = 'ACTIVO' | 'INACTIVO' | 'SIN_SEÑAL'

export interface Sensor {
  id: string
  codigo: string
  plazaId: string
  ubicacion: string
  estado: EstadoSensor
  /** ISO 8601. `null` si el sensor nunca ha emitido. */
  ultimaEmision: string | null
  /** Porcentaje 0-100. Opcional: no todos los modelos lo reportan. */
  bateria?: number
  observaciones?: string
}

/** Campos autogenerados (id, estado inicial, ultimaEmision) los define el sistema. */
export type CrearSensorDTO = Omit<Sensor, 'id' | 'estado' | 'ultimaEmision'>

export type ActualizarSensorDTO = Partial<CrearSensorDTO> & {
  estado?: EstadoSensor
}

/** Payload de `sensor:actualizado`: solo `id` es obligatorio, el resto son los campos que cambiaron. */
export type SensorActualizadoPayload = Pick<Sensor, 'id'> &
  Partial<Pick<Sensor, 'estado' | 'ultimaEmision' | 'bateria'>>

/** Payload de `sensor:alerta_sin_senal`: los datos descriptivos sirven de respaldo si el sensor no está en la lista local. */
export type AlertaSinSenalPayload = Pick<Sensor, 'id'> &
  Partial<Pick<Sensor, 'codigo' | 'plazaId' | 'ultimaEmision'>>

/** Alerta visible en la UI (una por sensor). */
export interface AlertaSensor {
  sensorId: string
  codigo: string
  plazaId: string
}

export type EstadoConexion = 'CONECTADO' | 'REINTENTANDO' | 'DESCONECTADO'

/** Evento de prueba que `simularEvento` entrega a los listeners del socket. */
export type EventoSimulado =
  | { tipo: 'sensor:actualizado'; payload: SensorActualizadoPayload }
  | { tipo: 'sensor:alerta_sin_senal'; payload: AlertaSinSenalPayload }
