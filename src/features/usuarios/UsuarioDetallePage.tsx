import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  Car,
  ClipboardList,
  History,
  Phone,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonTabla,
  Tabs,
  type Columna,
} from '@/components/ui'
import { fecha, fechaHora, tiempoTranscurrido } from '@/lib/formatters'
import { ApiError } from '@/lib/api-client'
import type { Acceso, Reserva, UsuarioDetalle, Vehiculo } from '@/lib/types/dominio'
import {
  consultarAccesosDeUsuario,
  consultarDetalleUsuario,
  consultarReservasDeUsuario,
} from '@/features/usuarios/usuarios.api'
import {
  nombreEstadoReserva,
  nombreEstadoUsuario,
  nombreTipo,
  tonoEstadoReserva,
} from '@/features/usuarios/usuarios.etiquetas'
import { nombreEstadoAcceso, tonoEstadoAcceso } from '@/components/shared/estadoAcceso'
import { iniciales } from '@/features/usuarios/usuario-detalle'

/**
 * Consulta del detalle de un usuario (RFA02).
 *
 * El perfil es de solo lectura: no hay acciones sobre el usuario desde aqui.
 * Editarlo o bloquearlo no aparece en la matriz de requerimientos, y agregar un
 * boton que la API no respalda es peor que no tenerlo.
 *
 * Tres consultas separadas y no una sola: el perfil y los vehiculos se cargan
 * siempre, pero los historiales se piden solo cuando se abre su pestana. Pedir
 * 24 filas de reservas para taparlas con la primera pestana es trabajo que el
 * administrador nunca ve.
 *
 * RNF12 no obliga a nada en la vista: pide que el DNI, la licencia y el CONADIS
 * no sean legibles en la base de datos. El paso 2 de RFA02 los lista como parte
 * del perfil que el administrador consulta, para verificar de un vistazo de quien
 * es el vehiculo que esta estacionado, asi que se muestran en claro.
 *
 * RFA10: consultar un perfil con datos sensibles es una accion que debe quedar
 * en el audit log, pero la registra el backend. El panel no escribe entradas de
 * auditoria: si lo hiciera, un fallo de red dejaria un hueco en el registro.
 */

const TAMANIO_PAGINA = 10
type PestanaHistorial = 'accesos' | 'reservas'

/** Etiqueta y valor de un dato del perfil. */
function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  )
}

export function UsuarioDetallePage() {
  const { id = '' } = useParams()
  const navegar = useNavigate()

  const [pestana, setPestana] = useState<PestanaHistorial>('accesos')
  const [pagina, setPagina] = useState(1)

  const perfil = useQuery({
    queryKey: ['usuario', id],
    queryFn: () => consultarDetalleUsuario(id),
    enabled: id !== '',
  })

  const accesos = useQuery({
    queryKey: ['usuario', id, 'accesos', pagina],
    queryFn: () => consultarAccesosDeUsuario(id, pagina, TAMANIO_PAGINA),
    enabled: id !== '' && pestana === 'accesos',
    // Al cambiar de pagina se mantiene la tabla anterior atenuada en vez de
    // parpadear a un esqueleto.
    placeholderData: (anterior) => anterior,
  })

  const reservas = useQuery({
    queryKey: ['usuario', id, 'reservas', pagina],
    queryFn: () => consultarReservasDeUsuario(id, pagina, TAMANIO_PAGINA),
    enabled: id !== '' && pestana === 'reservas',
    placeholderData: (anterior) => anterior,
  })

  function volverAlListado() {
    navegar('/usuarios')
  }

  function cambiarPestana(siguiente: string) {
    setPestana(siguiente as PestanaHistorial)
    // Cada historial arranca en su primera pagina: la pagina 3 de accesos no
    // significa nada para el historial de reservas.
    setPagina(1)
  }

  return (
    <div className="space-y-5">
      <Button
        variante="fantasma"
        tamano="sm"
        izquierda={<ArrowLeft className="size-4" aria-hidden="true" />}
        onClick={volverAlListado}
      >
        Volver a usuarios
      </Button>

      {perfil.isPending ? (
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : perfil.isError ? (
        <Card>
          <CardContent>
            {perfil.error instanceof ApiError && perfil.error.status === 404 ? (
              <EmptyState
                titulo="Ese usuario no existe"
                descripcion="El identificador no corresponde a ningun usuario registrado. Puede que la cuenta se haya dado de baja."
                icono={<TriangleAlert className="size-8" aria-hidden="true" />}
                accion={
                  <Button variante="secundario" onClick={volverAlListado}>
                    Ir al listado de usuarios
                  </Button>
                }
              />
            ) : (
              <ErrorState
                descripcion={perfil.error instanceof Error ? perfil.error.message : undefined}
                onReintentar={() => perfil.refetch()}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <EncabezadoPerfil perfil={perfil.data.perfil} />

          <Card>
            <CardHeader>
              <CardTitle>Datos personales</CardTitle>
              <CardDescription>
                El DNI, la licencia y el CONADIS se almacenan cifrados (RNF12) y llegan al panel
                para que puedas verificar la identidad de quien estaciona.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <Campo etiqueta="Codigo institucional">
                  <span className="font-mono">{perfil.data.perfil.codigo}</span>
                </Campo>
                <Campo etiqueta="Correo">{perfil.data.perfil.correo}</Campo>
                <Campo etiqueta="Telefono">
                  {perfil.data.perfil.telefono ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400" aria-hidden="true" />
                      {perfil.data.perfil.telefono}
                    </span>
                  ) : (
                    <span className="text-slate-400">Sin registrar</span>
                  )}
                </Campo>
                <Campo etiqueta="Tipo">{nombreTipo(perfil.data.perfil.tipo)}</Campo>
                <Campo etiqueta="Estado de la cuenta">
                  <Badge tono={perfil.data.perfil.estado === 'ACTIVO' ? 'exito' : 'alerta'}>
                    {nombreEstadoUsuario(perfil.data.perfil.estado)}
                  </Badge>
                </Campo>
                <Campo etiqueta="Registrado el">{fecha(perfil.data.perfil.registradoEn)}</Campo>

                <Campo etiqueta="DNI">
                  <span className="font-mono">{perfil.data.perfil.dni}</span>
                </Campo>
                {perfil.data.perfil.licenciaConducir ? (
                  <Campo etiqueta="Licencia de conducir">
                    <span className="font-mono">{perfil.data.perfil.licenciaConducir}</span>
                  </Campo>
                ) : (
                  <Campo etiqueta="Licencia de conducir">
                    <span className="text-slate-400">Sin registrar</span>
                  </Campo>
                )}
                <Campo etiqueta="Codigo CONADIS">
                  {perfil.data.perfil.conadis ? (
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <ShieldCheck className="size-3.5 text-slate-400" aria-hidden="true" />
                      {perfil.data.perfil.conadis}
                    </span>
                  ) : (
                    <span className="text-slate-400">No aplica</span>
                  )}
                </Campo>
              </dl>
            </CardContent>
          </Card>

          <Vehiculos vehiculos={perfil.data.vehiculos} />

          <Card>
            <CardContent>
              <Tabs
                etiquetaGrupo={`Historiales de ${perfil.data.perfil.nombre}`}
                activa={pestana}
                onCambio={cambiarPestana}
                paneles={[
                  {
                    id: 'accesos',
                    etiqueta: 'Accesos',
                    conteo: accesos.data?.total,
                    contenido: (
                      <TablaAccesos consulta={accesos} pagina={pagina} onPagina={setPagina} />
                    ),
                  },
                  {
                    id: 'reservas',
                    etiqueta: 'Reservas',
                    conteo: reservas.data?.total,
                    contenido: (
                      <TablaReservas consulta={reservas} pagina={pagina} onPagina={setPagina} />
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

/** Avatar, nombre, codigo y estado: lo primero que ve el administrador. */
function EncabezadoPerfil({ perfil }: { perfil: UsuarioDetalle }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="bg-brand-50 text-brand-800 flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold"
        >
          {iniciales(perfil.nombre)}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900">{perfil.nombre}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-mono">{perfil.codigo}</span>
            <Badge tono="marca">{nombreTipo(perfil.tipo)}</Badge>
            <Badge tono={perfil.estado === 'ACTIVO' ? 'exito' : 'alerta'}>
              {nombreEstadoUsuario(perfil.estado)}
            </Badge>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Vehiculos registrados (RF06) y cual de ellos es el principal (RF10).
 *
 * Se muestran como tabla y no como tarjetas porque el dato que importa es
 * compararlos entre si, y en una tabla el ojo puede recorrer la columna de
 * placas sin leer las de marca y color.
 */
function Vehiculos({ vehiculos }: { vehiculos: Vehiculo[] }) {
  const columnas: Columna<Vehiculo>[] = [
    {
      id: 'placa',
      encabezado: 'Placa',
      ancho: '120px',
      celda: (v) => <span className="font-mono text-xs font-semibold">{v.placa}</span>,
    },
    {
      id: 'vehiculo',
      encabezado: 'Vehiculo',
      celda: (v) => (
        <span>
          {v.marca} {v.modelo}
          <span className="text-slate-500"> · {v.color}</span>
        </span>
      ),
    },
    {
      id: 'principal',
      encabezado: 'Principal',
      celda: (v) =>
        v.principal ? (
          <Badge tono="oscuro">Vehiculo principal</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      id: 'situacion',
      encabezado: 'Situacion',
      celda: (v) =>
        v.ocupacion ? (
          <span className="flex flex-col items-start">
            <Badge tono="exito">
              <Car className="size-3.5" aria-hidden="true" />
              Adentro en {v.ocupacion.codigoPlaza}
            </Badge>
            <span className="mt-0.5 text-xs text-slate-500">
              desde hace {tiempoTranscurrido(v.ocupacion.ingresoEn)}
            </span>
          </span>
        ) : (
          <span className="text-slate-500">Fuera del estacionamiento</span>
        ),
    },
    {
      id: 'registradoEn',
      encabezado: 'Registrado',
      celda: (v) => fecha(v.registradoEn),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Car className="size-4 text-slate-400" aria-hidden="true" />
          Vehiculos registrados
        </CardTitle>
        <CardDescription>
          El vehiculo principal es el que se elige solo al reservar (RF10).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable<Vehiculo>
          columnas={columnas}
          datos={vehiculos}
          claveFila={(v) => v.id}
          vacio={
            <EmptyState
              titulo="Este usuario no tiene vehiculos registrados"
              descripcion="Podra reservar una plaza desde la app movil en cuanto registre uno."
              icono={<Car className="size-8" aria-hidden="true" />}
            />
          }
        />
      </CardContent>
    </Card>
  )
}

/**
 * Subconjunto del resultado de useQuery que necesitan las tablas. Declararlo
 * aqui evita atar los componentes de presentacion al hook y permite probarlos
 * con un objeto plano.
 */
type ConsultaHistorial<T> = {
  data?: { items: T[]; total: number }
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

function TablaAccesos({
  consulta,
  pagina,
  onPagina,
}: {
  consulta: ConsultaHistorial<Acceso>
  pagina: number
  onPagina: (pagina: number) => void
}) {
  const columnas: Columna<Acceso>[] = [
    { id: 'ingresoEn', encabezado: 'Ingreso', celda: (a) => fechaHora(a.ingresoEn) },
    {
      id: 'codigoPlaza',
      encabezado: 'Plaza',
      ancho: '90px',
      celda: (a) => <span className="font-mono text-xs">{a.codigoPlaza}</span>,
    },
    {
      id: 'vehiculo',
      encabezado: 'Vehiculo',
      ancho: '110px',
      celda: (a) => <span className="font-mono text-xs">{a.vehiculo}</span>,
    },
    {
      id: 'salidaEn',
      encabezado: 'Salida',
      celda: (a) =>
        a.salidaEn ? fechaHora(a.salidaEn) : <span className="text-slate-400">Dentro</span>,
    },
    {
      id: 'permanencia',
      encabezado: 'Permanencia',
      celda: (a) => (
        <span className="text-slate-600">
          {tiempoTranscurrido(a.ingresoEn, a.salidaEn ? new Date(a.salidaEn) : undefined)}
        </span>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (a) => <Badge tono={tonoEstadoAcceso(a.estado)}>{nombreEstadoAcceso(a.estado)}</Badge>,
    },
  ]

  return (
    <Historial
      consulta={consulta}
      columnas={columnas}
      pagina={pagina}
      onPagina={onPagina}
      icono={<History className="size-8" aria-hidden="true" />}
      tituloVacio="Este usuario todavia no ha ingresado al estacionamiento"
      descripcionVacio="Los ingresos y salidas apareceran aqui en cuanto use la app movil."
    />
  )
}

function TablaReservas({
  consulta,
  pagina,
  onPagina,
}: {
  consulta: ConsultaHistorial<Reserva>
  pagina: number
  onPagina: (pagina: number) => void
}) {
  const columnas: Columna<Reserva>[] = [
    { id: 'solicitadaEn', encabezado: 'Solicitada', celda: (r) => fechaHora(r.solicitadaEn) },
    {
      id: 'codigoPlaza',
      encabezado: 'Plaza',
      ancho: '90px',
      celda: (r) => <span className="font-mono text-xs">{r.codigoPlaza}</span>,
    },
    {
      id: 'venceEn',
      encabezado: 'Caduca',
      celda: (r) => <span className="text-slate-600">{fechaHora(r.venceEn)}</span>,
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (r) => (
        <Badge tono={tonoEstadoReserva(r.estado)}>{nombreEstadoReserva(r.estado)}</Badge>
      ),
    },
  ]

  return (
    <Historial
      consulta={consulta}
      columnas={columnas}
      pagina={pagina}
      onPagina={onPagina}
      icono={<ClipboardList className="size-8" aria-hidden="true" />}
      tituloVacio="Este usuario no ha reservado ninguna plaza"
      descripcionVacio="Las solicitudes que haga desde la app movil apareceran aqui."
    />
  )
}

/**
 * Envolvente comun de los dos historiales: los tres estados (cargando, error y
 * vacio) son los mismos en ambos, y duplicarlos haria que uno de los dos se
 * quede sin el mensaje de reintento.
 */
function Historial<T extends { id: string }>({
  consulta,
  columnas,
  pagina,
  onPagina,
  icono,
  tituloVacio,
  descripcionVacio,
}: {
  consulta: ConsultaHistorial<T>
  columnas: Columna<T>[]
  pagina: number
  onPagina: (pagina: number) => void
  icono: ReactNode
  tituloVacio: string
  descripcionVacio: string
}) {
  if (consulta.isError) {
    return (
      <ErrorState descripcion={consulta.error?.message} onReintentar={() => consulta.refetch()} />
    )
  }

  if (consulta.isPending) {
    return <SkeletonTabla filas={5} columnas={columnas.length} />
  }

  return (
    <DataTable<T>
      columnas={columnas}
      datos={consulta.data?.items ?? []}
      claveFila={(fila) => String(fila.id)}
      cargando={consulta.isFetching}
      paginacion={{
        pagina,
        pageSize: TAMANIO_PAGINA,
        total: consulta.data?.total ?? 0,
        onCambioPagina: onPagina,
      }}
      vacio={<EmptyState titulo={tituloVacio} descripcion={descripcionVacio} icono={icono} />}
    />
  )
}
