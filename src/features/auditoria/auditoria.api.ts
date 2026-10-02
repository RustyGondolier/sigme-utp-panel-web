import { get, query } from '@/lib/api-client'
import type { EntradaAuditoria } from '@/lib/types/dominio'

export interface FiltrosAuditoria {
  adminId?: string
  accion?: string
  elemento?: string
  desde?: string
  hasta?: string
}

export interface ListaAuditoria {
  items: EntradaAuditoria[]
}

export function listarAuditoria(filtros: FiltrosAuditoria = {}): Promise<ListaAuditoria> {
  return get<ListaAuditoria>(
    `/auditoria${query({
      adminId: filtros.adminId,
      accion: filtros.accion,
      elemento: filtros.elemento,
      desde: filtros.desde,
      hasta: filtros.hasta,
    })}`,
  )
}
