import { Link, NavLink } from 'react-router'
import { LogOut, X } from 'lucide-react'
import { ETIQUETA_GRUPO, ITEMS_MENU, MARCA, type GrupoMenu } from '@/app/navItems'
import { cn } from '@/lib/cn'
import { useSesion } from '@/features/auth/session.store'
import type { Sesion } from '@/lib/types/dominio'

/**
 * Menu lateral (RFA13).
 *
 * Fijo desde `lg`; por debajo es un drawer deslizante con overlay. No hay dos
 * implementaciones: lo unico que cambia entre movil y escritorio es si esta
 * abierto, y eso lo decide `ProtectedLayout` con `useMediaQuery`. Asi no puede
 * haber dos listas de items que se desincronicen.
 *
 * `<nav aria-label="Menu principal">` porque la pantalla tiene mas de una
 * lista de enlaces y el lector de pantalla necesita distinguirlas.
 */
export function Sidebar({
  sesion,
  abierto,
  onCerrar,
}: {
  sesion: Sesion
  abierto: boolean
  onCerrar: () => void
}) {
  const cerrarSesion = useSesion((e) => e.cerrar)

  // Al navegar en movil el drawer se cierra, o tapa la vista a la que se
  // acaba de entrar.
  const navegar = () => {
    if (abierto) onCerrar()
  }

  return (
    <>
      {/* Solo en movil: oscurece el fondo y cierra al tocar fuera. */}
      <div
        aria-hidden="true"
        onClick={onCerrar}
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden',
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        data-abierto={abierto ? 'true' : 'false'}
        className={cn(
          'bg-surface fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 transition-transform lg:translate-x-0',
          abierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
          <Link to="/" onClick={navegar} className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="bg-brand-700 flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
            >
              UTP
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">
                {MARCA.sigla} <span className="text-brand-700">{MARCA.institucion}</span>
              </span>
              <span className="block truncate text-[11px] text-slate-500">{MARCA.sistema}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menu"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-4">
            {(['principal', 'contenido', 'configuracion'] as GrupoMenu[]).map((grupo) => {
              const items = ITEMS_MENU.filter(
                (i) => i.grupo === grupo && i.roles.includes(sesion.rol),
              )
              if (items.length === 0) return null

              return (
                <li key={grupo}>
                  <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    {ETIQUETA_GRUPO[grupo]}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          end={item.path === '/'}
                          onClick={navegar}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive
                                ? 'bg-brand-50 text-brand-700 font-semibold'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                            )
                          }
                        >
                          <item.Icono className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.etiqueta}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-medium text-slate-800">{sesion.nombre}</p>
            <p className="truncate text-xs text-slate-500">{sesion.correo}</p>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  )
}
