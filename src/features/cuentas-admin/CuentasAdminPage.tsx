import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Power, RotateCcw, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  SkeletonTabla,
  useAvisos,
} from '@/components/ui'
import { fecha, fechaHora, nombreRol } from '@/lib/formatters'
import type { CuentaAdmin } from '@/lib/types/dominio'
import { consultarCuentasAdmin, crearCuenta, editarCuenta } from './cuentas.api'
import { nombreEstadoAdmin, tonoEstadoAdmin } from './cuentas.etiquetas'
import {
  MOTIVO_BLOQUEO,
  accionesDe,
  bloqueoDesactivacion,
  validarCorreo,
  validarCuenta,
  type FormularioCuenta,
} from './cuentas.reglas'

/**
 * Gestion de cuentas de administrador (RFA12).
 *
 * Es la primera vista que escribe, asi que el patron de mutaciones que se ve
 * aca es el que deben seguir las que vengan: la mutacion es la unica que
 * escribe, `invalidateQueries` recarga la lista porque no hay copia local que
 * pueda quedar vieja, y el error del servidor se muestra con `useAvisos`.
 *
 * La lista no trae filtros ni paginacion a proposito: el paso 2 del flujo pide
 * la lista completa y las cuentas del panel se cuentan con una mano. El
 * `ConfirmDialog` de la desactivacion no se reimplementa (regla 7): el motivo lo
 * pide y valida el componente.
 */

const CUENTAS = ['cuentas-admin'] as const

function formularioVacio(): FormularioCuenta {
  return { usuario: '', correo: '', rol: 'ADMINISTRADOR', contrasena: '' }
}

/** El mensaje del servidor ya viene en sus palabras; `useAvisos` solo lo muestra. */
function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrio un error inesperado.'
}

export function CuentasAdminPage() {
  const cliente = useQueryClient()
  const { avisar } = useAvisos()

  const [alta, setAlta] = useState(false)
  const [editando, setEditando] = useState<CuentaAdmin | null>(null)
  const [desactivando, setDesactivando] = useState<CuentaAdmin | null>(null)

  const consulta = useQuery({ queryKey: CUENTAS, queryFn: consultarCuentasAdmin })
  const cuentas = consulta.data?.items ?? []

  const alCambiar = (accion: 'exito' | 'error', texto: string) => {
    cliente.invalidateQueries({ queryKey: CUENTAS })
    avisar(accion, texto)
  }

  const crea = useMutation({
    mutationFn: crearCuenta,
    onSuccess: (cuenta) => {
      setAlta(false)
      alCambiar('exito', `Cuenta de ${cuenta.usuario} creada.`)
    },
    onError: (error) => avisar('error', mensajeDe(error)),
  })

  const edita = useMutation({
    mutationFn: ({ id, correo }: { id: string; correo: string }) => editarCuenta(id, { correo }),
    onSuccess: () => {
      setEditando(null)
      alCambiar('exito', 'Cuenta actualizada.')
    },
    onError: (error) => avisar('error', mensajeDe(error)),
  })

  const desactiva = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      editarCuenta(id, { estado: 'BLOQUEADO', motivo }),
    onSuccess: () => {
      setDesactivando(null)
      alCambiar('exito', 'Cuenta desactivada.')
    },
    onError: (error) => avisar('error', mensajeDe(error)),
  })

  const reactiva = useMutation({
    mutationFn: (id: string) => editarCuenta(id, { estado: 'ACTIVO' }),
    onSuccess: () => alCambiar('exito', 'Cuenta reactivada.'),
    onError: (error) => avisar('error', mensajeDe(error)),
  })

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cuentas de administrador</h1>
          <p className="mt-1 text-sm text-slate-600">
            Alta, edicion y desactivacion de las cuentas del panel. Las cuentas del sistema movil
            las administra el R04.
          </p>
        </div>
        <Button
          onClick={() => setAlta(true)}
          izquierda={<UserPlus className="size-4" aria-hidden="true" />}
        >
          Nueva cuenta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas registradas</CardTitle>
          <CardDescription>
            {consulta.isPending
              ? 'Cargando...'
              : `${cuentas.length} ${cuentas.length === 1 ? 'cuenta' : 'cuentas'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consulta.isPending ? (
            <SkeletonTabla filas={4} columnas={6} />
          ) : consulta.isError ? (
            <ErrorState
              descripcion="La lista de cuentas no se pudo cargar."
              onReintentar={() => void consulta.refetch()}
            />
          ) : cuentas.length === 0 ? (
            <EmptyState titulo="Todavia no hay cuentas" />
          ) : (
            <TablaCuentas
              cuentas={cuentas}
              reactivando={reactiva.isPending ? (reactiva.variables ?? null) : null}
              onReactivar={(cuenta) => reactiva.mutate(cuenta.id)}
              onEditar={setEditando}
              onDesactivar={setDesactivando}
            />
          )}
        </CardContent>
      </Card>

      {alta ? (
        <ModalAlta
          cargando={crea.isPending}
          error={crea.isError ? mensajeDe(crea.error) : null}
          onCerrar={() => setAlta(false)}
          onGuardar={(formulario) => crea.mutate(formulario)}
        />
      ) : null}

      {editando ? (
        <ModalEdicion
          cuenta={editando}
          cargando={edita.isPending}
          error={edita.isError ? mensajeDe(edita.error) : null}
          onCerrar={() => setEditando(null)}
          onGuardar={(correo) => edita.mutate({ id: editando.id, correo })}
        />
      ) : null}

      <ConfirmDialog
        abierto={Boolean(desactivando)}
        cargando={desactiva.isPending}
        titulo={`Desactivar la cuenta de ${desactivando?.usuario ?? ''}`}
        descripcion={
          desactivando
            ? `${desactivando.correo} no podra iniciar sesion hasta que se la reactive. La accion queda en el audit log.`
            : ''
        }
        etiquetaConfirmar="Desactivar"
        onCerrar={() => setDesactivando(null)}
        onConfirmar={(motivo) => desactivando && desactiva.mutate({ id: desactivando.id, motivo })}
      />
    </>
  )
}

/** Tabla de cuentas. Las acciones de cada fila salen de `accionesDe`. */
function TablaCuentas({
  cuentas,
  reactivando,
  onReactivar,
  onEditar,
  onDesactivar,
}: {
  cuentas: CuentaAdmin[]
  reactivando: string | null
  onReactivar: (cuenta: CuentaAdmin) => void
  onEditar: (cuenta: CuentaAdmin) => void
  onDesactivar: (cuenta: CuentaAdmin) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Cuentas de administrador del panel</caption>
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th scope="col" className="px-3 py-2 font-medium">
              Usuario
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Correo institucional
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Rol
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Estado
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Creada
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Ultimo acceso
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map((cuenta) => {
            const bloqueo =
              cuenta.estado === 'ACTIVO' ? bloqueoDesactivacion(cuenta, cuentas) : null

            return (
              <tr key={cuenta.id} className="border-b border-slate-100">
                <th scope="row" className="px-3 py-2.5 font-medium text-slate-900">
                  {cuenta.usuario}
                  {cuenta.esLaCuentaEnSesion ? (
                    <span className="ml-2 text-xs font-normal text-slate-500">(tu cuenta)</span>
                  ) : null}
                </th>
                <td className="px-3 py-2.5 text-slate-700">{cuenta.correo}</td>
                <td className="px-3 py-2.5 text-slate-700">{nombreRol(cuenta.rol)}</td>
                <td className="px-3 py-2.5">
                  <Badge tono={tonoEstadoAdmin(cuenta.estado)}>
                    {nombreEstadoAdmin(cuenta.estado)}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-slate-700">{fecha(cuenta.creadoEn)}</td>
                <td className="px-3 py-2.5 text-slate-700">
                  {cuenta.ultimoAccesoEn ? fechaHora(cuenta.ultimoAccesoEn) : 'Nunca'}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap justify-end gap-2">
                    {accionesDe(cuenta).map((accion) => (
                      <BotonAccion
                        key={accion}
                        accion={accion}
                        cuenta={cuenta}
                        cargando={reactivando === cuenta.id}
                        motivo={bloqueo ? MOTIVO_BLOQUEO[bloqueo] : null}
                        onReactivar={onReactivar}
                        onEditar={onEditar}
                        onDesactivar={onDesactivar}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Boton de accion de una fila.
 *
 * Si la cuenta tiene una reserva activa, el boton "Desactivar" no desaparece:
 * se muestra deshabilitado con el motivo debajo, porque E3 es una regla que el
 * administrador va a tener que conocer igual en cuanto se libere la reserva.
 */
function BotonAccion({
  accion,
  cuenta,
  cargando,
  motivo,
  onReactivar,
  onEditar,
  onDesactivar,
}: {
  accion: 'EDITAR' | 'DESACTIVAR' | 'REACTIVAR'
  cuenta: CuentaAdmin
  cargando: boolean
  motivo: string | null
  onReactivar: (cuenta: CuentaAdmin) => void
  onEditar: (cuenta: CuentaAdmin) => void
  onDesactivar: (cuenta: CuentaAdmin) => void
}) {
  if (accion === 'EDITAR') {
    return (
      <Button
        variante="secundario"
        izquierda={<Pencil className="size-4" aria-hidden="true" />}
        onClick={() => onEditar(cuenta)}
      >
        Editar
      </Button>
    )
  }

  if (accion === 'REACTIVAR') {
    return (
      <Button
        variante="secundario"
        cargando={cargando}
        izquierda={<RotateCcw className="size-4" aria-hidden="true" />}
        onClick={() => onReactivar(cuenta)}
      >
        Reactivar
      </Button>
    )
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        variante="secundario"
        disabled={Boolean(motivo)}
        izquierda={<Power className="size-4" aria-hidden="true" />}
        onClick={() => onDesactivar(cuenta)}
      >
        Desactivar
      </Button>
      {motivo ? <span className="max-w-40 text-xs text-slate-500">{motivo}</span> : null}
    </span>
  )
}

/** Alta de cuenta (paso 3). El formulario vive en el modal: al cerrar, se pierde. */
function ModalAlta({
  cargando,
  error,
  onCerrar,
  onGuardar,
}: {
  cargando: boolean
  error: string | null
  onCerrar: () => void
  onGuardar: (formulario: FormularioCuenta) => void
}) {
  const [formulario, setFormulario] = useState(formularioVacio)
  const [errores, setErrores] = useState<Partial<Record<keyof FormularioCuenta, string>>>({})

  const campo = <K extends keyof FormularioCuenta>(clave: K, valor: FormularioCuenta[K]) =>
    setFormulario((f) => ({ ...f, [clave]: valor }))

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    const encontrados = validarCuenta(formulario)
    setErrores(encontrados)
    if (Object.keys(encontrados).length === 0) onGuardar(formulario)
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Nueva cuenta de administrador"
      descripcion="La contrasena temporal la entrega el administrador al responsable y se le pide cambiarla al ingresar."
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="alta-cuenta" cargando={cargando}>
            Crear cuenta
          </Button>
        </>
      }
    >
      <form id="alta-cuenta" onSubmit={enviar} className="space-y-4" noValidate>
        <Field
          etiqueta="Nombre de usuario"
          htmlFor="usuario"
          error={errores.usuario}
          ayuda="Con el que se inicia sesion."
        >
          <Input
            id="usuario"
            value={formulario.usuario}
            onChange={(e) => campo('usuario', e.target.value)}
            autoComplete="off"
          />
        </Field>

        <Field etiqueta="Correo institucional" htmlFor="correo" error={errores.correo}>
          <Input
            id="correo"
            type="email"
            value={formulario.correo}
            onChange={(e) => campo('correo', e.target.value)}
            autoComplete="off"
          />
        </Field>

        <Field
          etiqueta="Contrasena temporal"
          htmlFor="contrasena"
          error={errores.contrasena}
          ayuda="El administrador la recibe y la cambia al primer ingreso."
        >
          <Input
            id="contrasena"
            type="password"
            value={formulario.contrasena}
            onChange={(e) => campo('contrasena', e.target.value)}
            autoComplete="new-password"
          />
        </Field>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Rol: <span className="font-medium text-slate-800">{nombreRol(formulario.rol)}</span>. El
          panel tiene un solo rol por ahora (RFA09), asi que se asigna automaticamente.
        </div>

        {error ? (
          <p role="alert" className="text-brand-700 text-sm">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}

/** Edicion (paso 5): solo el correo institucional cambia. */
function ModalEdicion({
  cuenta,
  cargando,
  error,
  onCerrar,
  onGuardar,
}: {
  cuenta: CuentaAdmin
  cargando: boolean
  error: string | null
  onCerrar: () => void
  onGuardar: (correo: string) => void
}) {
  const [correo, setCorreo] = useState(cuenta.correo)
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>()
  const sinCambios = correo.trim() === cuenta.correo

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    // Solo el correo se valida aca: el usuario y el rol de esta pantalla no se
    // editan, y validarlos de nuevo seria theater.
    const error = validarCorreo(correo)
    setErrorCorreo(error)
    if (!error) onGuardar(correo.trim())
  }

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={`Editar ${cuenta.usuario}`}
      descripcion="Paso 5: el nombre de usuario no cambia porque es con el que la cuenta inicia sesion."
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="edita-cuenta" cargando={cargando} disabled={sinCambios}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="edita-cuenta" onSubmit={enviar} className="space-y-4" noValidate>
        <div>
          <span className="block text-sm font-medium text-slate-700">Nombre de usuario</span>
          <p className="mt-1 text-sm text-slate-600">{cuenta.usuario}</p>
        </div>

        <Field etiqueta="Correo institucional" htmlFor="correo-edicion" error={errorCorreo}>
          <Input
            id="correo-edicion"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </Field>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Rol: <span className="font-medium text-slate-800">{nombreRol(cuenta.rol)}</span>. El rol
          se cambia cuando el panel tenga mas de uno.
        </div>

        {error ? (
          <p role="alert" className="text-brand-700 text-sm">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
