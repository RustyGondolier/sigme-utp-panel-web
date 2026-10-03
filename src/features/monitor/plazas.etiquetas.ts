import { Car, CircleCheck, Clock, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { EstadoPlaza } from './types/plaza.types'

export const ESTADOS_PLAZA: EstadoPlaza[] = ['LIBRE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO']

export const CONFIG_ESTADO_PLAZA: Record<
  EstadoPlaza,
  { etiqueta: string; plural: string; tarjeta: string; insignia: string; Icono: LucideIcon }
> = {
  LIBRE: {
    etiqueta: 'Libre',
    plural: 'Libres',
    tarjeta: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    insignia: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Icono: CircleCheck,
  },
  OCUPADA: {
    etiqueta: 'Ocupada',
    plural: 'Ocupadas',
    tarjeta: 'bg-rose-50 text-rose-700 border-rose-300',
    insignia: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    Icono: Car,
  },
  RESERVADA: {
    etiqueta: 'Reservada',
    plural: 'Reservadas',
    tarjeta: 'bg-amber-50 text-amber-700 border-amber-300',
    insignia: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Icono: Clock,
  },
  FUERA_DE_SERVICIO: {
    etiqueta: 'Fuera de servicio',
    plural: 'Fuera de servicio',
    tarjeta: 'bg-slate-100 text-slate-500 border-slate-300',
    insignia: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    Icono: TriangleAlert,
  },
}

/** 45 -> "45 min"; 85 -> "1h 25m"; 120 -> "2h". */
export function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas}h` : `${horas}h ${resto}m`
}

export function formatearFechaHora(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}
