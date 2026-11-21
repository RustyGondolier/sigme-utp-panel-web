import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'
import { CLASES_TONO, type TonoKPI } from '../dashboard.estilos'

interface Props {
  icono: LucideIcon
  titulo: string
  valor: ReactNode
  subtitulo?: string
  /** Texto corto de estado (ej: "Alta"); toma el color del `tono`. */
  indicador?: string
  tono?: TonoKPI
  /** Contenido extra bajo el valor: barra, chips, etc. */
  children?: ReactNode
}

export function KPICard({
  icono: Icono,
  titulo,
  valor,
  subtitulo,
  indicador,
  tono = 'neutro',
  children,
}: Props) {
  const clases = CLASES_TONO[tono]

  return (
    <Card>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className={`flex size-10 items-center justify-center rounded-lg ${clases.icono}`}>
              <Icono className="size-5" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-medium text-slate-500">{titulo}</h3>
          </div>
          {indicador && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${clases.indicador}`}
            >
              {indicador}
            </span>
          )}
        </div>

        <div>
          <p className="text-3xl font-semibold text-slate-800">{valor}</p>
          {subtitulo && <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>}
        </div>

        {children}
      </div>
    </Card>
  )
}
