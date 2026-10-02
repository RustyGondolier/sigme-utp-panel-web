import { get, post, query } from '@/lib/api-client'
import type { Reserva } from '@/lib/types/dominio'

export interface ListaReservas {
  items: Reserva[]
}

export interface FiltrosReservas {
  cocheraId?: string
  estado?: string
}

export function listarReservas(filtros: FiltrosReservas = {}): Promise<ListaReservas> {
  return get<ListaReservas>(
    `/reservas${query({
      cocheraId: filtros.cocheraId,
      estado: filtros.estado,
    })}`,
  )
}

export function cancelarReserva(id: string, motivo: string): Promise<Reserva> {
  return post<Reserva>(`/reservas/${id}/cancelar`, { motivo })
}
