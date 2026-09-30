import { AlertTriangle, Ban, CheckCircle2, Clock } from 'lucide-react'
import type { EstadoPlaza } from '@/lib/types/dominio'

/**
 * Configuracion de los cuatro estados de plaza (RFA03). Sin JSX a proposito:
 * la tabla de clases y los iconos se usan desde el componente, desde el grid y
 * desde los tests, y mezclarlos en el `.tsx` rompe el fast refresh de React.
 *
 * ACCESIBILIDAD: ningun estado se distingue solo por color. Cada uno lleva icono
 * y texto, y la tinta se eligio para superar 4.5:1 contra su propio fondo. El
 * verde UTP de marca solo da 2.65:1 sobre blanco, por eso el texto va en
 * `*-ink`, nunca en el color de la marca.
 */
export interface ConfiguracionEstado {
  etiqueta: string
  /** Clases del relleno (fondo). */
  relleno: string
  /** Clases del texto. */
  tinta: string
  /** El sensor fuera de servicio se distingue ademas con borde punteado. */
  borde: string
  Icono: typeof CheckCircle2
}

export const ESTADOS: Record<EstadoPlaza, ConfiguracionEstado> = {
  LIBRE: {
    etiqueta: 'Libre',
    relleno: 'bg-plaza-libre-fill',
    tinta: 'text-plaza-libre-ink',
    borde: 'border-plaza-libre-fill',
    Icono: CheckCircle2,
  },
  OCUPADA: {
    etiqueta: 'Ocupada',
    relleno: 'bg-plaza-ocupada-fill',
    tinta: 'text-plaza-ocupada-ink',
    borde: 'border-plaza-ocupada-fill',
    Icono: Ban,
  },
  RESERVADA: {
    etiqueta: 'Reservada',
    relleno: 'bg-plaza-reservada-fill',
    tinta: 'text-plaza-reservada-ink',
    borde: 'border-plaza-reservada-fill',
    Icono: Clock,
  },
  FUERA_DE_SERVICIO: {
    etiqueta: 'Sensor fuera de servicio',
    relleno: 'bg-plaza-fuera-fill',
    tinta: 'text-plaza-fuera-ink',
    borde: 'border-dashed border-plaza-fuera-borde',
    Icono: AlertTriangle,
  },
}

export const ETIQUETA_ESTADO: Record<EstadoPlaza, string> = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  FUERA_DE_SERVICIO: 'Sensor fuera de servicio',
}

/** Etiqueta legible de un estado, para textos y para lectores de pantalla. */
export function etiquetaEstado(estado: EstadoPlaza): string {
  return ETIQUETA_ESTADO[estado]
}

/** Clases de la plaza. Las consume el grid y el detalle lateral. */
export function clasesEstadoPlaza(estado: EstadoPlaza): ConfiguracionEstado {
  return ESTADOS[estado]
}
