import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * Tabla de datos. La comparten RFA01 (usuarios), RFA04 (sensores), RFA07
 * (accesos), RFA10 (audit log) y RFA12 (cuentas admin): cinco vistas con la
 * misma necesidad, asi que la tabla vive una sola vez aqui.
 *
 * DECISION: no usa @tanstack/react-table. La version fijada en package.json es
 * la 9, que reescribio la API por completo (createTableHook/useTable en lugar
 * de useReactTable/getCoreRowModel) y aun no tiene suficiente documentacion
 * publica. Ademas las cinco vistas ordenan y filtran en el servidor (RFA01 lo
 * pide explicitamente), asi que no se usaria ninguna de las features que la
 * libreria aporta. Un <table> con descriptores de columna tipados hace lo
 * mismo sin curva de aprendizaje. Si alguna vez hace falta orden local, la
 * pieza a cambiar es esta, no las vistas.
 */

export interface Columna<T> {
  /** Clave estable. Se usa como React key y para depurar. */
  id: string
  encabezado: ReactNode
  /** Contenido de la celda. */
  celda: (fila: T) => ReactNode
  /** Ancho sugerido de la columna. */
  ancho?: string
  alinear?: 'izquierda' | 'centro' | 'derecha'
  className?: string
}

export interface PaginacionEstado {
  pagina: number
  pageSize: number
  total: number
  onCambioPagina: (pagina: number) => void
}

const alineaciones = {
  izquierda: 'text-left',
  centro: 'text-center',
  derecha: 'text-right',
} as const

export function DataTable<T>({
  columnas,
  datos,
  paginacion,
  claveFila,
  cargando = false,
  alClickFila,
  filaActivaId,
  vacio,
  className,
}: {
  columnas: Columna<T>[]
  datos: T[]
  paginacion?: PaginacionEstado
  claveFila: (fila: T) => string
  cargando?: boolean
  /** RFA03 y RFA05: al seleccionar una plaza o reserva se abre su detalle. */
  alClickFila?: (fila: T) => void
  filaActivaId?: string
  vacio?: ReactNode
  className?: string
}) {
  const conAccion = Boolean(alClickFila)

  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columnas.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  style={col.ancho ? { width: col.ancho } : undefined}
                  className={cn(
                    'px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-600 uppercase',
                    alineaciones[col.alinear ?? 'izquierda'],
                    col.className,
                  )}
                >
                  {col.encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(cargando && 'opacity-60')}>
            {datos.length === 0 ? (
              <tr>
                <td
                  colSpan={columnas.length}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  {vacio ?? 'Sin registros para los filtros aplicados.'}
                </td>
              </tr>
            ) : (
              datos.map((fila) => {
                const id = claveFila(fila)
                return (
                  <tr
                    key={id}
                    data-fila={id}
                    data-activa={filaActivaId === id ? 'true' : undefined}
                    onClick={conAccion ? () => alClickFila?.(fila) : undefined}
                    onKeyDown={
                      conAccion
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              alClickFila?.(fila)
                            }
                          }
                        : undefined
                    }
                    tabIndex={conAccion ? 0 : undefined}
                    role={conAccion ? 'button' : undefined}
                    className={cn(
                      'border-b border-slate-100 last:border-0',
                      conAccion && 'hover:bg-slate-50 focus-visible:bg-slate-50',
                      filaActivaId === id && 'bg-brand-50',
                    )}
                  >
                    {columnas.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-3 align-middle text-slate-700',
                          alineaciones[col.alinear ?? 'izquierda'],
                          col.className,
                        )}
                      >
                        {col.celda(fila)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {paginacion ? <Paginacion {...paginacion} /> : null}
    </div>
  )
}

/**
 * Paginacion server-side. Muestra el rango real ("1-10 de 148") porque en el
 * historial de accesos y en la lista de usuarios el total es informacion util.
 */
export function Paginacion({ pagina, pageSize, total, onCambioPagina }: PaginacionEstado) {
  if (total === 0) return null

  const ultimaPagina = Math.max(1, Math.ceil(total / pageSize))
  const desde = (pagina - 1) * pageSize + 1
  const hasta = Math.min(pagina * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">
          {desde}-{hasta}
        </span>{' '}
        de <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variante="secundario"
          tamano="icono"
          onClick={() => onCambioPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2 text-xs text-slate-600">
          {pagina} / {ultimaPagina}
        </span>
        <Button
          variante="secundario"
          tamano="icono"
          onClick={() => onCambioPagina(pagina + 1)}
          disabled={pagina >= ultimaPagina}
          aria-label="Pagina siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
