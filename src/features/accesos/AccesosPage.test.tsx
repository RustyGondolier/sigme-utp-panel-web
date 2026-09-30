import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { AccesosPage } from './AccesosPage'

/**
 * Criterios de aceptacion de RFA07 sobre el mock de siempre: 300 accesos (25
 * usuarios con 12 ingresos cada uno), paginados de a 10.
 *
 * A diferencia del historial de RFA02, este es global, asi que las aserciones se
 * acotan a la fila o al dialogo cuando el mismo texto aparece en dos zonas (el
 * nombre del usuario esta en la fila y tambien en el titulo del detalle).
 *
 * Los totales se cuentan contra los datos reales del fixture, no a ojo: el
 * fixture reparte los ingresos en dias corridos y los dias recientes son los mas
 * poblados, asi que un total escrito a mano seria una bomba de reloj.
 */

function nuevoQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function PerfilStub() {
  return <div>Perfil del usuario</div>
}

function renderizar() {
  return render(
    <QueryClientProvider client={nuevoQueryClient()}>
      <MemoryRouter initialEntries={['/accesos']}>
        <Routes>
          <Route path="/accesos" element={<AccesosPage />} />
          <Route path="/usuarios/:id" element={<PerfilStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** DataTable pinta "1-10 de 25" repartido en varios spans (ver UsuariosPage.test). */
const textoPaginacion =
  (texto: string) =>
  (_contenido: string, elemento: Element | null): boolean =>
    elemento?.textContent?.replace(/\s+/g, ' ').trim() === texto

/** Una fila concreta, por la clave que DataTable le pone al <tr>. */
function fila(clave: string) {
  const nodo = document.querySelector(`[data-fila="${clave}"]`)
  if (!nodo) {
    const claves = [...document.querySelectorAll('[data-fila]')]
      .map((n) => n.getAttribute('data-fila'))
      .join(', ')
    throw new Error(`No existe la fila "${clave}". Filas en pantalla: ${claves || '(ninguna)'}`)
  }
  return within(nodo as HTMLElement)
}

const dialogo = () => within(screen.getByRole('dialog'))

/** Espera a que el historial sin filtros haya cargado. */
function esperarHistorial() {
  return screen.findByText(textoPaginacion('1-10 de 300'))
}

/**
 * Abre el detalle de una fila por su clave.
 *
 * No se hace clic por el nombre del usuario porque cada usuario aporta 12
 * ingresos al historial global: en la primera pagina su nombre se repite y
 * `getByText` fallaria por ambiguedad.
 */
async function abrirFila(clave: string, usuario: UserEvent) {
  const nodo = document.querySelector(`[data-fila="${clave}"]`)
  if (!nodo) throw new Error(`No existe la fila "${clave}"`)
  await usuario.click(nodo as HTMLElement)
}

/** Todas las celdas de datos, sin la fila de "sin registros". */
function filasVisibles() {
  return [...document.querySelectorAll('tbody tr')] as HTMLElement[]
}

/**
 * `YYYY-MM-DD` del dia local que cae dentro de `diasAtras`.
 *
 * Se construye con `setDate` en vez de restar milisegundos al now para no
 * depender de la zona horaria: el filtro de la vista acota el dia local y el
 * test tiene que hablar del mismo dia.
 */
function diaLocal(diasAtras: number) {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function acotarDesde(dia: string) {
  fireEvent.change(screen.getByLabelText('Accesos desde la fecha'), { target: { value: dia } })
}

function acotarHasta(dia: string) {
  fireEvent.change(screen.getByLabelText('Accesos hasta la fecha'), { target: { value: dia } })
}

/**
 * Ultimo query string con el que se pidio `path`.
 *
 * RFA01 fijo que el filtrado y la paginacion son server-side, y RFA07 hereda
 * esa regla: el paso 4 actualiza la lista "segun los filtros aplicados". Espiar
 * la peticion es lo que lo verifica, porque una vista que filtrara en el
 * navegador se veria igual en la tabla pero no moveria nada en la URL.
 */
function capturarQuery(path: string) {
  const captura: { params: URLSearchParams | null } = { params: null }
  const listener = ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    if (url.pathname === path) captura.params = url.searchParams
  }

  server.events.on('request:start', listener)

  return {
    params: () => captura.params,
    dispose: () => server.events.removeListener('request:start', listener),
  }
}

let limpiar: Array<() => void> = []

afterEach(() => {
  server.resetHandlers()
  limpiar.forEach((fn) => fn())
  limpiar = []
})

describe('AccesosPage (RFA07)', () => {
  it('muestra las columnas que pide el paso 2 del flujo', async () => {
    renderizar()

    await esperarHistorial()

    for (const encabezado of [
      'Usuario',
      'Cochera',
      'Plaza',
      'Hora de solicitud',
      'Hora de ingreso',
      'Hora de salida',
      'Estado',
    ]) {
      expect(screen.getByRole('columnheader', { name: encabezado })).toBeInTheDocument()
    }
  })

  it('muestra usuario, cochera, plaza, solicitud, ingreso, salida y estado', async () => {
    renderizar()
    await esperarHistorial()

    // acc-01-01 es el ingreso abierto de Ana Quispe: el mas reciente del
    // historial y el unico sin hora de salida, con el vehiculo en A-02.
    const acceso = fila('acc-01-01')

    expect(acceso.getByText('Ana Quispe Huaman')).toBeInTheDocument()
    expect(acceso.getByText('20241001')).toBeInTheDocument()
    expect(acceso.getByText('Cochera principal')).toBeInTheDocument()
    expect(acceso.getByText('A-02')).toBeInTheDocument()
    // Una vez como columna de salida ("Dentro" = sigue adentro) y otra como
    // estado del registro.
    expect(acceso.getAllByText('Dentro')).toHaveLength(2)
    expect(acceso.getAllByRole('cell')).toHaveLength(7)
  })

  it('distingue un acceso finalizado de uno que sigue abierto', async () => {
    renderizar()

    await esperarHistorial()

    const cerrado = fila('acc-01-02')
    expect(cerrado.getByText('Finalizado')).toBeInTheDocument()
    // "Dentro" es la columna de salida del ingreso abierto, no un estado.
    expect(cerrado.queryByText('Dentro')).not.toBeInTheDocument()
    expect(cerrado.getAllByRole('cell')[5]).not.toHaveTextContent('Dentro')
  })

  it('pagina el historial en el servidor', async () => {
    const usuario = userEvent.setup()
    renderizar()

    expect(await screen.findByText(textoPaginacion('1-10 de 300'))).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Pagina siguiente' }))

    expect(await screen.findByText(textoPaginacion('11-20 de 300'))).toBeInTheDocument()
    expect(document.querySelector('[data-fila="acc-01-01"]')).toBeNull()
  })

  it('busca por nombre de usuario sin distincion de mayusculas', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await esperarHistorial()
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar por usuario' }), 'maria')

    // Maria Gutierrez Salazar aporta sus 12 ingresos y ningun otro usuario
    // coincide con "maria".
    expect(await screen.findByText(textoPaginacion('1-10 de 12'))).toBeInTheDocument()
    expect(screen.getAllByText('Maria Gutierrez Salazar')).toHaveLength(10)
    expect(screen.queryByText('Ana Quispe Huaman')).not.toBeInTheDocument()
  })

  it('busca por codigo institucional', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await esperarHistorial()
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar por usuario' }), '20241004')

    // Un usuario con 12 ingresos: solo 10 entran en la pagina, y el filtro
    // tambien tiene que excluir a los demas.
    expect(await screen.findByText(textoPaginacion('1-10 de 12'))).toBeInTheDocument()
    expect(screen.queryByText('Ana Quispe Huaman')).not.toBeInTheDocument()
  })

  it('filtra por plaza y solo deja filas de esa plaza', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await esperarHistorial()
    await usuario.selectOptions(screen.getByLabelText('Filtrar por plaza'), 'pla-03')

    // A-03 tiene 38 de los 300 accesos del historial.
    expect(await screen.findByText(textoPaginacion('1-10 de 38'))).toBeInTheDocument()
    expect(document.querySelector('[data-fila="acc-01-01"]')).toBeNull()

    const filas = filasVisibles()
    expect(filas).toHaveLength(10)
    filas.forEach((f) => expect(within(f).getByText('A-03')).toBeInTheDocument())
  })

  it('manda los filtros al servidor en vez de filtrar en el navegador', async () => {
    const usuario = userEvent.setup()
    const captura = capturarQuery('/api/accesos')
    limpiar.push(captura.dispose)

    renderizar()
    await esperarHistorial()

    await usuario.selectOptions(screen.getByLabelText('Filtrar por cochera'), 'coch-01')
    await usuario.selectOptions(screen.getByLabelText('Filtrar por plaza'), 'pla-02')
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar por usuario' }), '20241001')
    acotarDesde(diaLocal(5))

    await waitFor(() => {
      expect(captura.params()?.get('busqueda')).toBe('20241001')
    })
    expect(captura.params()?.get('cocheraId')).toBe('coch-01')
    expect(captura.params()?.get('plazaId')).toBe('pla-02')
    // Las fechas viajan como instantes ISO, no como cadenas 'YYYY-MM-DD'.
    expect(captura.params()?.get('desde')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(Number(captura.params()?.get('pagina'))).toBe(1)
    expect(Number(captura.params()?.get('pageSize'))).toBe(10)
  })

  it('acota el rango de fechas al dia local completo', async () => {
    const captura = capturarQuery('/api/accesos')
    limpiar.push(captura.dispose)

    renderizar()
    await esperarHistorial()

    const [anio, mes, numeroDia] = diaLocal(5).split('-').map(Number)
    acotarDesde(diaLocal(5))
    acotarHasta(diaLocal(5))

    // Si el backend recibiera la fecha cruda la leeria a medianoche UTC, que en
    // Lima son las 19:00 del dia anterior: el filtro arrancaria cinco horas
    // tarde y dejaria fuera del rango la tarde que el administrador pidio.
    await waitFor(() => {
      expect(captura.params()?.get('desde')).toBe(
        new Date(anio, mes - 1, numeroDia, 0, 0, 0, 0).toISOString(),
      )
    })
    expect(captura.params()?.get('hasta')).toBe(
      new Date(anio, mes - 1, numeroDia, 23, 59, 59, 999).toISOString(),
    )
  })

  it('filtra por un rango de fechas', async () => {
    renderizar()
    await esperarHistorial()

    // El fixture reparte los ingresos en dias corridos segun el indice del
    // usuario, asi que el dia de hace 3 dias trae 9 accesos (uno por cada
    // usuario cuyo indice entra en la ventana) y ninguno mas.
    acotarDesde(diaLocal(3))
    acotarHasta(diaLocal(3))

    expect(await screen.findByText(textoPaginacion('1-9 de 9'))).toBeInTheDocument()
    expect(filasVisibles()).toHaveLength(9)
    expect(fila('acc-03-01').getByText('Maria Gutierrez Salazar')).toBeInTheDocument()
    // El ingreso abierto es de hoy, asi que no puede salir en este rango.
    expect(document.querySelector('[data-fila="acc-01-01"]')).toBeNull()
  })

  it('trata la fecha exacta como el rango con los dos extremos iguales', async () => {
    renderizar()
    await esperarHistorial()

    acotarDesde(diaLocal(3))
    acotarHasta(diaLocal(3))
    expect(await screen.findByText(textoPaginacion('1-9 de 9'))).toBeInTheDocument()

    // Ampliar solo el extremo "hasta" suma el dia anterior: 9 + 6 = 15.
    acotarHasta(diaLocal(2))
    expect(await screen.findByText(textoPaginacion('1-10 de 15'))).toBeInTheDocument()
  })

  it('avisa cuando el rango de fechas esta invertido', async () => {
    renderizar()
    await esperarHistorial()

    acotarDesde(diaLocal(2))
    acotarHasta(diaLocal(8))
    await waitFor(() => {
      expect(screen.queryByText(textoPaginacion('1-10 de 300'))).not.toBeInTheDocument()
    })

    // "desde" pasa a un dia mas reciente que el "hasta" que ya estaba puesto.
    acotarDesde(diaLocal(6))

    expect(await screen.findByText(/La fecha "desde" es posterior/)).toBeInTheDocument()
  })

  it('nombra la cochera en las plazas cuando hay mas de una (RNF11)', async () => {
    server.use(
      http.get('/api/cocheras', () =>
        HttpResponse.json({
          items: [
            { id: 'coch-01', nombre: 'Cochera principal', totalPlazas: 8 },
            { id: 'coch-02', nombre: 'Cochera de ingenieria', totalPlazas: 1 },
          ],
        }),
      ),
      http.get('/api/plazas', () =>
        HttpResponse.json({
          items: [
            { id: 'pla-01', codigo: 'A-01', cocheraId: 'coch-01' },
            { id: 'pla-09', codigo: 'A-01', cocheraId: 'coch-02' },
          ],
        }),
      ),
    )

    renderizar()
    await esperarHistorial()

    // Sin el nombre, el selector ofreceria dos "A-01" indistinguibles y el
    // administrador filtraria por la cochera equivocada creyendo que filtro bien.
    expect(
      await screen.findByRole('option', { name: 'A-01 · Cochera principal' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'A-01 · Cochera de ingenieria' })).toBeInTheDocument()
  })

  it('limita las plazas a las de la cochera elegida', async () => {
    server.use(
      http.get('/api/cocheras', () =>
        HttpResponse.json({
          items: [
            { id: 'coch-01', nombre: 'Cochera principal', totalPlazas: 8 },
            { id: 'coch-02', nombre: 'Cochera de ingenieria', totalPlazas: 1 },
          ],
        }),
      ),
      http.get('/api/plazas', () =>
        HttpResponse.json({
          items: [
            { id: 'pla-01', codigo: 'A-01', cocheraId: 'coch-01' },
            { id: 'pla-09', codigo: 'B-01', cocheraId: 'coch-02' },
          ],
        }),
      ),
    )

    const usuario = userEvent.setup()
    renderizar()
    await esperarHistorial()

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: 'B-01 · Cochera de ingenieria' })).toHaveLength(
        1,
      )
    })
    await usuario.selectOptions(screen.getByLabelText('Filtrar por cochera'), 'coch-02')

    expect(
      screen.queryByRole('option', { name: 'A-01 · Cochera principal' }),
    ).not.toBeInTheDocument()
  })

  it('muestra mensaje informativo cuando no hay registros (E1)', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await esperarHistorial()
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar por usuario' }), 'zzz-nadie')

    expect(await screen.findByText('No hay accesos con esos filtros')).toBeInTheDocument()
    expect(screen.queryByText(textoPaginacion('1-10 de 300'))).not.toBeInTheDocument()
  })

  it('muestra error con opcion de reintentar (E2) y recupera el historial', async () => {
    const usuario = userEvent.setup()
    server.use(
      http.get('/api/accesos', () =>
        HttpResponse.json({ message: 'Fallo simulado del servidor' }, { status: 500 }),
      ),
    )

    renderizar()

    expect(await screen.findByText('No se pudieron cargar los datos')).toBeInTheDocument()
    expect(screen.getByText('Fallo simulado del servidor')).toBeInTheDocument()

    server.resetHandlers()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await esperarHistorial()).toBeInTheDocument()
  })

  it('abre el detalle completo al seleccionar un registro (paso 5)', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await esperarHistorial()
    await abrirFila('acc-01-01', usuario)

    const detalle = dialogo()
    expect(detalle.getByRole('heading', { name: 'Detalle del acceso' })).toBeInTheDocument()
    expect(detalle.getByText('ABC-123')).toBeInTheDocument()
    expect(detalle.getByText('Cochera principal')).toBeInTheDocument()
    expect(detalle.getByText('A-02')).toBeInTheDocument()
    // La tabla solo dice "Dentro" en la salida; el detalle aclara que sigue
    // adentro del estacionamiento.
    expect(detalle.getByText('Dentro del estacionamiento')).toBeInTheDocument()
    expect(detalle.getByText('Dentro')).toBeInTheDocument()
    // Lo que la tabla no muestra: la permanencia y la solicitud con su hora.
    expect(detalle.getByText('Permanencia')).toBeInTheDocument()
    expect(detalle.getByText('Hora de solicitud')).toBeInTheDocument()
  })

  it('lleva al perfil del usuario desde el detalle', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await esperarHistorial()
    await abrirFila('acc-01-01', usuario)
    await usuario.click(screen.getByRole('button', { name: 'Ver perfil del usuario' }))

    expect(await screen.findByText('Perfil del usuario')).toBeInTheDocument()
  })

  it('vuelve a la primera pagina al cambiar un filtro', async () => {
    const usuario = userEvent.setup()
    renderizar()

    expect(await screen.findByText(textoPaginacion('1-10 de 300'))).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Pagina siguiente' }))
    expect(await screen.findByText(textoPaginacion('11-20 de 300'))).toBeInTheDocument()

    await usuario.selectOptions(screen.getByLabelText('Filtrar por plaza'), 'pla-03')

    // "Pagina anterior" vuelve a estar deshabilitado: la vista esta en la 1.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pagina anterior' })).toBeDisabled()
    })
    expect(screen.queryByText(textoPaginacion('11-20 de 300'))).not.toBeInTheDocument()
  })

  it('limpiar filtros restaura el historial completo', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await esperarHistorial()
    await usuario.selectOptions(screen.getByLabelText('Filtrar por plaza'), 'pla-03')
    await screen.findByText(textoPaginacion('1-10 de 38'))

    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(await screen.findByText(textoPaginacion('1-10 de 300'))).toBeInTheDocument()
    expect(screen.getByLabelText('Filtrar por plaza')).toHaveValue('')
    expect(screen.getByLabelText('Accesos desde la fecha')).toHaveValue('')
    expect(screen.getByLabelText('Accesos hasta la fecha')).toHaveValue('')
  })
})
