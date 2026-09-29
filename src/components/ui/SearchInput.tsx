import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Campo de busqueda con limpiar. Aparece en RFA01, RFA07, RFA08, RFA10 y
 * RFA12, siempre junto a los demas filtros de la misma barra.
 */
export function SearchInput({
  valor,
  onCambio,
  placeholder = 'Buscar...',
  className,
  etiqueta,
}: {
  valor: string
  onCambio: (valor: string) => void
  placeholder?: string
  className?: string
  etiqueta: string
}) {
  const id = useId()

  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
      />
      <input
        id={id}
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400"
      />
      {valor ? (
        <button
          type="button"
          onClick={() => onCambio('')}
          aria-label="Limpiar busqueda"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

/**
 * Barra de filtros. Agrupa los controles de filtrado sobre la tabla para que
 * las cinco vistas con filtros compartan la misma disposicion: en escritorio
 * en una fila, en movil apilados.
 */
export function FilterBar({
  children,
  onLimpiar,
  hayFiltros = false,
  className,
}: {
  children: React.ReactNode
  onLimpiar?: () => void
  hayFiltros?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">{children}</div>
      {onLimpiar ? (
        <button
          type="button"
          onClick={onLimpiar}
          disabled={!hayFiltros}
          className="text-brand-700 self-start text-xs font-medium underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline lg:self-auto"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  )
}
