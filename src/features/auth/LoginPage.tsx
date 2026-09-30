import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { ApiError } from '@/lib/api-client'
import { credencialesSchema, iniciarSesion } from '@/features/auth/auth.api'
import { useSesion } from '@/features/auth/session.store'

/**
 * Formulario de login (RFA09).
 *
 * RNF07: tras 5 intentos fallidos el servidor responde 423 con `bloqueadoHasta`.
 * El contador NO se lleva aqui a proposito: si el front lo llevara, el bloqueo
 * se podria evitar recargando la pagina, y el requerimiento pide que el limite
 * venga del servidor. Aqui solo se refleja lo que el servidor devuelve.
 *
 * El mensaje tampoco revela si fallo el usuario o la contrasena: el servidor
 * devuelve siempre el mismo texto para los dos casos y el front lo muestra tal
 * cual, sin reinterpretarlo.
 */
export default function LoginPage() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const establecer = useSesion((e) => e.establecer)

  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    setBloqueado(false)

    const validado = credencialesSchema.safeParse({ usuario, contrasena })
    if (!validado.success) {
      setError(validado.error.issues[0]?.message ?? 'Revisa los datos')
      return
    }

    setEnviando(true)
    try {
      const sesion = await iniciarSesion(validado.data)
      establecer(sesion)

      // Vuelve a la vista que el administrador intentaba abrir antes de que el
      // guard lo mandara al login.
      const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? '/'
      navegar(destino, { replace: true })
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        setBloqueado(e.codigo === 'BLOQUEADO' || e.status === 423)
      } else {
        setError('Ocurrio un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span
            aria-hidden="true"
            className="bg-brand-700 mx-auto mb-3 flex size-11 items-center justify-center rounded-xl text-sm font-black text-white"
          >
            UTP
          </span>
          <h1 className="text-lg font-bold text-slate-900">SIGME UTP</h1>
          <p className="text-sm text-slate-500">Panel de administracion</p>
        </div>

        <form
          onSubmit={manejarEnvio}
          noValidate
          className="bg-surface rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <Field etiqueta="Usuario" htmlFor="usuario" requerido>
            <Input
              id="usuario"
              name="usuario"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={enviando || bloqueado}
              autoFocus
            />
          </Field>

          <Field etiqueta="Contrasena" htmlFor="contrasena" requerido>
            <Input
              id="contrasena"
              name="contrasena"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={enviando || bloqueado}
            />
          </Field>

          {error ? (
            <div
              role="alert"
              className="border-brand-200 bg-brand-50 text-brand-700 mt-1 mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {error}
                {bloqueado ? ' Intenta de nuevo mas tarde.' : ''}
              </span>
            </div>
          ) : null}

          <Button type="submit" disabled={enviando || bloqueado} className="w-full">
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
