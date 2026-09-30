import type { ReactNode } from 'react'
import type { Sesion } from '@/lib/types/dominio'
import { cn } from '@/lib/cn'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

/**
 * Estructura de pagina (RFA13): menu lateral persistente, cabecera y area de
 * contenido.
 *
 * Este componente NO decide nada: recibe la sesion ya resuelta y la ruta ya
 * autorizada. Toda la logica de sesion, rol y pathname vive en
 * `app/layouts/ProtectedLayout`, que es el unico que conoce el router. Asi el
 * layout se puede probar sin montar rutas y no hay que tocarlo cuando cambie la
 * navegacion.
 */
export function AppLayout({
  sesion,
  children,
  menuAbierto,
  onAlternarMenu,
}: {
  sesion: Sesion
  children: ReactNode
  /** En movil el menu es un drawer; en escritorio es fijo. Lo controla el padre. */
  menuAbierto: boolean
  onAlternarMenu: (abierto: boolean) => void
}) {
  return (
    <div className="min-h-dvh bg-slate-50">
      {/* En movil el sidebar va en un overlay; en lg desaparece del flujo. */}
      <Sidebar sesion={sesion} abierto={menuAbierto} onCerrar={() => onAlternarMenu(false)} />

      <div className="lg:pl-64">
        <Header
          sesion={sesion}
          onAbrirMenu={() => onAlternarMenu(true)}
          menuAbierto={menuAbierto}
        />
        <main id="contenido" className={cn('px-4 py-5 sm:px-6 lg:px-8', menuAbierto && 'lg:pl-8')}>
          {children}
        </main>
      </div>
    </div>
  )
}
