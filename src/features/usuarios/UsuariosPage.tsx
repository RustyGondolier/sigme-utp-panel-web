import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { UsersRound } from 'lucide-react'
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  SearchInput,
  Select,
  SkeletonTabla,
  type Columna,
} from '@/components/ui'
import { fecha } from '@/lib/formatters'
import { useDebounce } from '@/lib/hooks/useDebounce'
import type { EstadoUsuario, TipoUsuario, Usuario } from '@/lib/types/dominio'
import { consultarUsuarios } from '@/features/usuarios/usuarios.api'
import {
  ESTADOS_USUARIO,
  TIPOS_USUARIO,
  nombreEstadoUsuario,
  nombreTipo,
} from '@/features/usuarios/usuarios.etiquetas'

/**
 * Consulta de usuarios registrados (RFA01).
 *
 * Filtros y paginacion van al servidor: la vista es una mera espejo de lo que
 * la API devuelve (paso 3 y 4 del flujo). La busqueda se debouncea para no
 * disparar una peticion por tecla; al cambiar cualquier filtro se vuelve a la
 * primera pagina, que es lo que un administrador espera de una tabla paginada.
 */

const TAMANIO_PAGINA = 10

export function UsuariosPage() {
  const navegar = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<TipoUsuario | ''>('')
  const [estado, setEstado] = useState<EstadoUsuario | ''>('')
  const [pagina, setPagina] = useState(1)

  const termino = useDebounce(busqueda)

  const consulta = useQuery({
    queryKey: ['usuarios', { termino, tipo, estado, pagina, pageSize: TAMANIO_PAGINA }],
    queryFn: () =>
      consultarUsuarios({ busqueda: termino, tipo, estado, pagina, pageSize: TAMANIO_PAGINA }),
    // Al paginar o filtrar se mantiene el listado anterior visible (atenuado)
    // en vez de parpadear a un esqueleto. Solo se muestra el esqueleto la
    // primera vez que se carga la pagina.
    placeholderData: (anterior) => anterior,
  })

  const hayFiltros = termino !== '' || tipo !== '' || estado !== ''

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  function cambiarTipo(valor: TipoUsuario | '') {
    setTipo(valor)
    setPagina(1)
  }

  function cambiarEstado(valor: EstadoUsuario | '') {
    setEstado(valor)
    setPagina(1)
  }

  function limpiarFiltros() {
    setBusqueda('')
    setTipo('')
    setEstado('')
    setPagina(1)
  }

  const columnas: Columna<Usuario>[] = [
    {
      id: 'codigo',
      encabezado: 'Codigo',
      ancho: '120px',
      celda: (u) => <span className="font-mono text-xs">{u.codigo}</span>,
    },
    {
      id: 'nombre',
      encabezado: 'Nombre completo',
      celda: (u) => <span className="font-medium text-slate-800">{u.nombre}</span>,
    },
    {
      id: 'correo',
      encabezado: 'Correo',
      celda: (u) => u.correo,
    },
    {
      id: 'tipo',
      encabezado: 'Tipo',
      celda: (u) => <Badge tono="marca">{nombreTipo(u.tipo)}</Badge>,
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (u) => (
        <Badge tono={u.estado === 'ACTIVO' ? 'exito' : 'alerta'}>
          {nombreEstadoUsuario(u.estado)}
        </Badge>
      ),
    },
    {
      id: 'registradoEn',
      encabezado: 'Fecha de registro',
      celda: (u) => fecha(u.registradoEn),
    },
  ]

  return (
    <Card>
      <FilterBar onLimpiar={limpiarFiltros} hayFiltros={hayFiltros}>
        <SearchInput
          valor={busqueda}
          onCambio={cambiarBusqueda}
          placeholder="Buscar por nombre o codigo"
          etiqueta="Buscar usuarios"
          className="sm:max-w-xs"
        />
        <Select
          value={tipo}
          onChange={(e) => cambiarTipo(e.target.value as TipoUsuario | '')}
          aria-label="Filtrar por tipo de usuario"
          className="sm:w-44"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_USUARIO.map((t) => (
            <option key={t} value={t}>
              {nombreTipo(t)}
            </option>
          ))}
        </Select>
        <Select
          value={estado}
          onChange={(e) => cambiarEstado(e.target.value as EstadoUsuario | '')}
          aria-label="Filtrar por estado de usuario"
          className="sm:w-40"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_USUARIO.map((e) => (
            <option key={e} value={e}>
              {nombreEstadoUsuario(e)}
            </option>
          ))}
        </Select>
      </FilterBar>

      {consulta.isError ? (
        <div className="p-5">
          <ErrorState
            descripcion={consulta.error instanceof Error ? consulta.error.message : undefined}
            onReintentar={() => consulta.refetch()}
          />
        </div>
      ) : consulta.data ? (
        <DataTable<Usuario>
          columnas={columnas}
          datos={consulta.data.items}
          claveFila={(u) => u.id}
          cargando={consulta.isFetching}
          // RFA01 paso 5: seleccionar un usuario abre su detalle (RFA02).
          alClickFila={(u) => navegar(`/usuarios/${u.id}`)}
          vacio={
            <EmptyState
              titulo="No hay usuarios con esos filtros"
              descripcion="Quita la busqueda o cambia el tipo y el estado para ver mas resultados."
              icono={<UsersRound className="size-8" aria-hidden="true" />}
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
          <SkeletonTabla filas={6} columnas={6} />
        </div>
      )}
    </Card>
  )
}
