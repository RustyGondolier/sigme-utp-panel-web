export type EstadoPlaza = 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'FUERA_DE_SERVICIO'

export interface VehiculoEstacionado {
  placa: string
  usuario: string
  /**
   * ISO 8601. En `OCUPADA` es la hora de ingreso; en `RESERVADA`, el momento
   * en que se hizo la reserva. Los minutos transcurridos se derivan de este valor.
   */
  horaIngreso: string
}

export interface Plaza {
  id: string
  /** Ej: "A-01", "B-05". */
  codigo: string
  /** Ej: "Sótano 1". */
  sotano: string
  /** Ej: "Zona A". */
  zona: string
  estado: EstadoPlaza
  /** Código del sensor asociado, ej: "SNS-A01". Opcional: puede haber plazas sin sensor. */
  sensorCodigo?: string
  /** Obligatorio si `estado` es `OCUPADA` o `RESERVADA`; ausente en los demás estados. */
  ocupante?: VehiculoEstacionado
}

export interface FiltrosPlaza {
  /** Busca por código de plaza, sensor, placa o usuario. */
  busqueda: string
  /** Nombre del sótano (ej: "Sótano 1") o `'TODOS'`. */
  sotano: string
  estado: EstadoPlaza | 'TODOS'
}

/** Payload de `plaza:estado_cambiado`. `ocupante` viaja cuando la plaza pasa a OCUPADA o RESERVADA. */
export interface EventoPlazaCambiada {
  id: string
  estado: EstadoPlaza
  ocupante?: VehiculoEstacionado
}
