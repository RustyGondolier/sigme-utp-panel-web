import { Link } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { useSesionActual } from '@/features/auth/session.store'
import { nombreRol } from '@/lib/formatters'

/**
 * RFA13 caso E1: el rol no tiene permiso para la seccion solicitada. Se
 * muestra un mensaje y se ofrece volver al dashboard, en vez de una pantalla
 * en blanco o un 404 que el administrador no sabe interpretar.
 */
export default function AccesoDenegadoPage() {
  const { sesion } = useSesionActual()

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span
        aria-hidden="true"
        className="bg-brand-50 text-brand-700 mb-4 flex size-12 items-center justify-center rounded-full"
      >
        <ShieldAlert className="size-6" />
      </span>
      <h1 className="text-lg font-bold text-slate-900">Acceso denegado</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tu rol {sesion ? `(${nombreRol(sesion.rol)})` : ''} no tiene permiso para ver esta seccion.
      </p>
      <Link to="/" className="text-brand-700 mt-5 text-sm font-semibold hover:underline">
        Volver al dashboard
      </Link>
    </div>
  )
}
