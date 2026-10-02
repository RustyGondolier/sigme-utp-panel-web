import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { History, UserRound } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  Modal,
  SearchInput,
  Select,
  SkeletonTabla,
  type Columna,
} from '@/components/ui'
import { nombreEstadoAcceso, tonoEstadoAcceso } from '@/components/shared/estadoAcceso'
import { fechaHora, tiempoTranscurrido } from '@/lib/formatters'
import { useDebounce } from '@/lib/hooks/useDebounce'
import type { Acceso, Cochera, Plaza } from '@/lib/types/dominio'
import {
  consultarAccesos,
  consultarCocheras,
  consultarPlazas,
} from '@/features/accesos/accesos.api'
import {
  FILTROS_INICIALES,
  hayFiltros,
  rangoDelDia,
  rangoInvertido,
  type FiltrosAccesosVista,
} from '@/features/accesos/accesos.filtros'

/**
 * Consulta del historial de accesos (RFA07).
 *
 * Los cuatro filtros del paso 3 y la paginacion van al servidor, igual que en
 * RFA01: la vista elige que quiere ver y el backend recorta. La tabla es de solo
 * lectura, porque RFA07 no pide ninguna accion sobre un acceso y un boton que
 * la API no respalda es peor que no tenerlo.
 *
 * El rango de fechas son dos inputs en vez de un selector de "fecha exacta o
 * rango": con los dos, la fecha exacta es el caso en que ambos coinciden, y no
 * hacen falta dos modos de filtrado ni un menu que se recuerde. Lo que la vista
 * acota son instantes, no cadenas de fecha: eso lo hace `accesos.filtros`.
 */

const TAMANIO_PAGINA = 10

export function AccesosPage() {
  const navegar = useNavigate()

  const [filtros, setFiltros] = useState<FiltrosAccesosVista>(FILTROS_INICIALES)
  const [pagina, setPagina] = useState(1)
  const [seleccion, setSeleccion] = useState<Acceso | null>(null)

  // La busqueda se debouncea para no disparar una peticion por tecla; los
  // selects y las fechas no lo necesitan porque solo cambian al confirmar.
  const busqueda = useDebounce(filtros.busqueda)
  const { desde, hasta } = rangoDelDia(filtros.desde, filtros.hasta)

  const consulta = useQuery({
    queryKey: [
      'accesos',
      {
        busqueda,
        cocheraId: filtros.cocheraId,
        plazaId: filtros.plazaId,
        desde,
        hasta,
        pagina,
        pageSize: TAMANIO_PAGINA,
      },
    ],
    queryFn: () =>
      consultarAccesos({
        busqueda,
        desde,
        hasta,
        cocheraId: filtros.cocheraId,
        plazaId: filtros.plazaId,
        pagina,
        pageSize: TAMANIO_PAGINA,
      }),
    // Al paginar o filtrar se mantiene el listado anterior atenuado en vez de
    // parpadear a un esqueleto.
    placeholderData: (anterior) => anterior,
  })

  // Los catalogos de cochera y plaza son configuracion, no datos que cambian
  // durante la sesion: se piden una vez y no se vuelven a pedir al filtrar.
  const cocheras = useQuery({
    queryKey: ['cocheras'],
    queryFn: consultarCocheras,
    staleTime: Infinity,
  })

  const plazas = useQuery({
    queryKey: ['plazas'],
    queryFn: consultarPlazas,
    staleTime: Infinity,
  })

  // Al cambiar cualquier filtro se vuelve a la primera pagina: la pagina 4 de
  // un listado que se acaba de acortar casi nunca existe, y es lo que un
  // administrador espera de una tabla paginada.
  function aplicarFiltros(cambio: Partial<FiltrosAccesosVista>) {
    setFiltros((anterior) => ({ ...anterior, ...cambio }))
    setPagina(1)
  }

  // Cambiar de cochera deja sin sentido la plaza elegida si era de otra, asi que
  // se limpia. Filtrar en memoria durante el render, sin useEffect, es lo que
  // pide la regla 5.
  const opcionesPlaza = useMemo(
    () => plazasDeCochera(plazas.data?.items ?? [], cocheras.data?.items ?? [], filtros.cocheraId),
    [plazas.data, cocheras.data, filtros.cocheraId],
  )

  const columnas: Columna<Acceso>[] = [
    {
      id: 'usuario',
      encabezado: 'Usuario',
      celda: (a) => (
        <span className="flex flex-col">
          <span className="font-medium text-slate-800">{a.nombreUsuario}</span>
          <span className="font-mono text-xs text-slate-500">{a.codigoUsuario}</span>
        </span>
      ),
    },
    {
      id: 'cochera',
      encabezado: 'Cochera',
      celda: (a) => <span className="text-slate-600">{a.cocheraNombre}</span>,
    },
    {
      id: 'plaza',
      encabezado: 'Plaza',
      ancho: '90px',
      celda: (a) => <span className="font-mono text-xs">{a.codigoPlaza}</span>,
    },
    {
      id: 'solicitadaEn',
      encabezado: 'Hora de solicitud',
      celda: (a) => <span className="text-slate-600">{fechaHora(a.solicitadaEn)}</span>,
    },
    {
      id: 'ingresoEn',
      encabezado: 'Hora de ingreso',
      celda: (a) => <span className="font-medium text-slate-800">{fechaHora(a.ingresoEn)}</span>,
    },
    {
      id: 'salidaEn',
      encabezado: 'Hora de salida',
      celda: (a) =>
        a.salidaEn ? (
          <span className="text-slate-600">{fechaHora(a.salidaEn)}</span>
        ) : (
          <span className="text-slate-400">Dentro</span>
        ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      ancho: '110px',
      celda: (a) => <Badge tono={tonoEstadoAcceso(a.estado)}>{nombreEstadoAcceso(a.estado)}</Badge>,
    },
  ]

  const invertido = rangoInvertido(filtros)

  return (
    <>
      <Card>
        <FilterBar
          onLimpiar={() => aplicarFiltros(FILTROS_INICIALES)}
          hayFiltros={hayFiltros(filtros)}
        >
          <SearchInput
            valor={filtros.busqueda}
            onCambio={(busqueda) => aplicarFiltros({ busqueda })}
            placeholder="Buscar por nombre o codigo"
            etiqueta="Buscar por usuario"
            className="sm:max-w-xs"
          />
          <Select
            value={filtros.cocheraId}
            onChange={(e) => aplicarFiltros({ cocheraId: e.target.value, plazaId: '' })}
            aria-label="Filtrar por cochera"
            className="sm:w-44"
          >
            <option value="">Todas las cocheras</option>
            {(cocheras.data?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={filtros.plazaId}
            onChange={(e) => aplicarFiltros({ plazaId: e.target.value })}
            aria-label="Filtrar por plaza"
            className="sm:w-44"
          >
            <option value="">Todas las plazas</option>
            {opcionesPlaza.map((p) => (
              <option key={p.plaza.id} value={p.plaza.id}>
                {p.etiqueta}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-2 sm:w-auto">
            <label htmlFor="accesos-desde" className="sr-only">
              Accesos desde la fecha
            </label>
            <Input
              id="accesos-desde"
              type="date"
              value={filtros.desde}
              onChange={(e) => aplicarFiltros({ desde: e.target.value })}
              className="sm:w-40"
            />
            <span aria-hidden="true" className="text-xs text-slate-400">
              a
            </span>
            <label htmlFor="accesos-hasta" className="sr-only">
              Accesos hasta la fecha
            </label>
            <Input
              id="accesos-hasta"
              type="date"
              value={filtros.hasta}
              onChange={(e) => aplicarFiltros({ hasta: e.target.value })}
              className="sm:w-40"
            />
          </div>
        </FilterBar>

        {invertido ? (
          <p
            role="status"
            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800"
          >
            La fecha "desde" es posterior a la fecha "hasta", asi que el rango no devuelve
            registros.
          </p>
        ) : null}

        {consulta.isError ? (
          <div className="p-5">
            <ErrorState
              descripcion={consulta.error instanceof Error ? consulta.error.message : undefined}
              onReintentar={() => consulta.refetch()}
            />
          </div>
        ) : consulta.data ? (
          <DataTable<Acceso>
            columnas={columnas}
            datos={consulta.data.items}
            claveFila={(a) => a.id}
            cargando={consulta.isFetching}
            // RFA07 paso 5: seleccionar un registro abre su detalle completo.
            alClickFila={setSeleccion}
            filaActivaId={seleccion?.id}
            vacio={
              <EmptyState
                titulo="No hay accesos con esos filtros"
                descripcion="Amplia el rango de fechas o quita la busqueda, la cochera y la plaza para ver mas registros."
                icono={<History className="size-8" aria-hidden="true" />}
              />
            }
            paginacion={{
              pagina: consulta.data.pagina,
              pageSize: TAMANIO_PAGINA,
              total: consulta.data.total,
              onCambioPagina: setPagina,
            }}
          />
        ) : (
          <div className="p-5">
            <SkeletonTabla filas={6} columnas={7} />
          </div>
        )}
      </Card>

      <DetalleAcceso
        acceso={seleccion}
        onCerrar={() => setSeleccion(null)}
        onVerPerfil={(id) => {
          setSeleccion(null)
          navegar(`/usuarios/${id}`)
        }}
      />
    </>
  )
}

/**
 * Etiquetas de plaza del filtro, con la cochera agregada cuando hay mas de una.
 *
 * Sin ese agregado, con dos cocheras el selector ofreceria dos "A-01" indistinguibles
 * y el administrador filtraria por la cochera equivocada creyendo que filtro bien.
 * Con una sola cochera sobra el dato, asi que no se ensucia la etiqueta.
 */
function plazasDeCochera(
  plazas: Plaza[],
  cocheras: Cochera[],
  cocheraId: string,
): { plaza: Plaza; etiqueta: string }[] {
  const nombreDe = new Map(cocheras.map((c) => [c.id, c.nombre]))
  const conVarias = cocheras.length > 1

  return plazas
    .filter((p) => cocheraId === '' || p.cocheraId === cocheraId)
    .map((plaza) => ({
      plaza,
      etiqueta: conVarias
        ? `${plaza.codigo} · ${nombreDe.get(plaza.cocheraId) ?? 'Sin cochera'}`
        : plaza.codigo,
    }))
    .sort((a, b) => a.plaza.codigo.localeCompare(b.plaza.codigo))
}

/**
 * Detalle completo del registro (RFA07 paso 5).
 *
 * Se lee de la fila y no de un endpoint `/accesos/:id`: la fila ya trae todo lo
 * que se muestra, y abrir un modal no justifica un viaje extra al servidor. Lo
 * que si suma es el acceso al perfil del usuario (RFA02), que es la pregunta
 * natural que surge al ver un ingreso raro: de quien es este vehiculo.
 */
function DetalleAcceso({
  acceso,
  onCerrar,
  onVerPerfil,
}: {
  acceso: Acceso | null
  onCerrar: () => void
  onVerPerfil: (usuarioId: string) => void
}) {
  return (
    <Modal
      abierto={acceso !== null}
      onCerrar={onCerrar}
      titulo="Detalle del acceso"
      descripcion={acceso ? `${acceso.nombreUsuario} · ${acceso.codigoUsuario}` : undefined}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cerrar
          </Button>
          {acceso ? (
            <Button
              izquierda={<UserRound className="size-4" aria-hidden="true" />}
              onClick={() => onVerPerfil(acceso.usuarioId)}
            >
              Ver perfil del usuario
            </Button>
          ) : null}
        </>
      }
    >
      {acceso ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Campo etiqueta="Cochera">{acceso.cocheraNombre}</Campo>
          <Campo etiqueta="Plaza">
            <span className="font-mono">{acceso.codigoPlaza}</span>
          </Campo>
          <Campo etiqueta="Vehiculo">
            <span className="font-mono">{acceso.vehiculo}</span>
          </Campo>
          <Campo etiqueta="Estado">
            <Badge tono={tonoEstadoAcceso(acceso.estado)}>
              {nombreEstadoAcceso(acceso.estado)}
            </Badge>
          </Campo>
          <Campo etiqueta="Hora de solicitud">{fechaHora(acceso.solicitadaEn)}</Campo>
          <Campo etiqueta="Hora de ingreso">{fechaHora(acceso.ingresoEn)}</Campo>
          <Campo etiqueta="Hora de salida">
            {acceso.salidaEn ? (
              fechaHora(acceso.salidaEn)
            ) : (
              <span className="text-slate-400">Dentro del estacionamiento</span>
            )}
          </Campo>
          <Campo etiqueta="Permanencia">
            {tiempoTranscurrido(
              acceso.ingresoEn,
              acceso.salidaEn ? new Date(acceso.salidaEn) : undefined,
            )}
          </Campo>
        </dl>
      ) : null}
    </Modal>
  )
}

/** Etiqueta y valor de un dato del detalle. */
function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  )
}
