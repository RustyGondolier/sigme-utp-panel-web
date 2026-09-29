import { Navigate, Outlet, useLocation } from 'react-router'
import { expirada, useSesion } from '@/features/auth/session.store'

/**
 * Rutas protegidas. Sin sesion vigente manda a /login y recuerda a donde
 * queria ir el administrador, para que tras autenticarse caiga en la vista que
 * abrio y no siempre en el dashboard.
 *
 * Se apoya en `navItems` para decidir si un path es valido: si alguien teclea
 * una URL que no existe, el catch-all de `AppRoutes` lo manda al dashboard.
 */
export function RequireAuth() {
  const sesion = useSesion((e) => e.sesion)
  const ubicacion = useLocation()

  if (expirada(sesion)) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  return <Outlet />
}

/**
 * Rutas restringidas por rol. RFA13 caso E1: si el rol no tiene permiso, se
 * muestra un mensaje de acceso denegado y se redirige al dashboard, en vez de
 * dejar una pantalla en blanco o un error 404.
 */
export function RequireRole({ roles }: { roles: string[] }) {
  const sesion = useSesion((e) => e.sesion)

  if (!sesion) return <Navigate to="/login" replace />

  if (!roles.includes(sesion.rol)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return <Outlet />
}
