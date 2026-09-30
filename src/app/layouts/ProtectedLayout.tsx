import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { itemPorPath } from '@/app/navItems'
import { expirada, useSesion } from '@/features/auth/session.store'
import { BREAKPOINT_LG, useMediaQuery } from '@/lib/hooks/useMediaQuery'

/**
 * Pegamento entre el router y el layout. Es el unico archivo que sabe a la vez
 * de sesion, de ruta actual y de `navItems`; el layout de `components/layout` se
 * limita a pintar y recibe la sesion ya resuelta.
 *
 * El estado del drawer vive aqui porque depende del tamano de pantalla: en
 * escritorio el menu esta siempre abierto y en movil se cierra al navegar. La
 * media query se lee con un hook en vez de duplicar la lista de items en dos
 * componentes, que es como los menus se desincronizan.
 */
export function ProtectedLayout() {
  const sesion = useSesion((e) => e.sesion)
  const { pathname } = useLocation()
  const esEscritorio = useMediaQuery(BREAKPOINT_LG)
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Sin sesion, `RequireAuth` ya esta redirigiendo. Aqui se devuelve null para
  // no renderizar medio layout durante ese instante.
  if (!sesion || expirada(sesion)) return null

  const item = itemPorPath(pathname, sesion.rol)

  return (
    <AppLayout
      sesion={sesion}
      menuAbierto={esEscritorio || menuAbierto}
      onAlternarMenu={setMenuAbierto}
    >
      {item ? (
        <PageHeader
          titulo={item.etiqueta}
          descripcion={item.descripcion}
          rfa={item.rfa}
          grupo={item.grupo}
        />
      ) : null}
      <Outlet />
    </AppLayout>
  )
}
