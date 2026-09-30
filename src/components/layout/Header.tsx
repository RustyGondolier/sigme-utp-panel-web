import { Menu } from 'lucide-react'
import type { Sesion } from '@/lib/types/dominio'
import { nombreRol } from '@/lib/formatters'
import { ConnectionBanner } from '@/components/layout/ConnectionBanner'

/**
 * Cabecera de la aplicacion. Solo cumple tres cosas: identificar al
 * administrador, avisar cuando la API no responde y abrir el menu en movil.
 *
 * No lleva el titulo de la vista: eso vive en `PageHeader`, porque el titulo
 * pertenece a la pagina, no a la chrome que la rodea.
 */
export function Header({
  sesion,
  onAbrirMenu,
  menuAbierto,
}: {
  sesion: Sesion
  onAbrirMenu: () => void
  menuAbierto: boolean
}) {
  return (
    <header className="bg-surface/95 sticky top-0 z-20 border-b border-slate-200 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
          aria-expanded={menuAbierto}
          className="-ml-1 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <p className="hidden text-sm text-slate-500 sm:block">Panel de administracion</p>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-medium text-slate-800">{sesion.nombre}</span>
            <span className="block text-xs text-slate-500">{nombreRol(sesion.rol)}</span>
          </span>
          <span
            aria-hidden="true"
            className="bg-brand-700 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          >
            {iniciales(sesion.nombre)}
          </span>
        </div>
      </div>

      {/* RNF06: si la API cae, el aviso va arriba de todo, no escondido en una
          vista concreta. */}
      <ConnectionBanner />
    </header>
  )
}

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
