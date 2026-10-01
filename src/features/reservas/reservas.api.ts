import { get, post } from '@/lib/api-client'
import type { Reserva } from '@/lib/types/dominio'

export interface ListaReservas {
  items: Reserva[]
}

export function listarReservas(): Promise<ListaReservas> {
  return get<ListaReservas>('/reservas')
}

export function cancelarReserva(id: string, motivo: string): Promise<Reserva> {
  return post<Reserva>(`/reservas/${id}/cancelar`, { motivo })
}
