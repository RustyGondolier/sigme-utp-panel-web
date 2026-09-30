import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { UsuarioDetallePage } from './UsuarioDetallePage'

/**
 * Criterios de aceptacion de RFA02, sobre el mock de siempre.
 *
 * Se prueba usr-01 (Ana Quispe Huaman) porque es el unico con un ingreso
 * abierto: su plaza es la A-02, la misma que muestra el Monitor, y esa
 * coherencia entre pantallas es justamente lo que hay que verificar. Tiene 12
 * accesos y 13 reservas para que ambos historiales tengan una segunda pagina.
 *
 * Las aserciones se acotan a la tarjeta o a la fila que corresponde. El codigo
 * del usuario, la placa y la palabra "Dentro" aparecen en varias zonas de la
 * vista a proposito, asi que buscarlos en toda la pagina no probaria nada.
 */

function nuevoQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

/** Ver RFA01: el rango de la paginacion se reparte en varios spans. */
const textoPaginacion =
  (texto: string) =>
  (_contenido: string, elemento: Element | null): boolean =>
    elemento?.textContent?.replace(/\s+/g, ' ').trim() === texto

function renderizar(id = 'usr-01') {
  return render(
    <QueryClientProvider client={nuevoQueryClient()}>
      <MemoryRouter initialEntries={[`/usuarios/${id}`]}>
        <Routes>
          <Route path="/usuarios" element={<div>Listado de usuarios</div>} />
          <Route path="/usuarios/:id" element={<UsuarioDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/**
 * La tarjeta que contiene un heading, sea CardTitle o el nombre del usuario en
 * el encabezado. `bg-surface` es la clase de la raiz de Card; acota el alcance
 * sin depender del orden de las secciones de la vista.
 */
async function tarjeta(titulo: string) {
  const encabezado = await screen.findByRole('heading', { name: titulo })
  const raiz = encabezado.closest('div.bg-surface')
  if (!raiz) throw new Error(`No se encontro la tarjeta "${titulo}"`)
  return within(raiz as HTMLElement)
}

/** Una fila concreta de la tabla, por la clave que DataTable le pone. */
function fila(clave: string) {
  const nodo = document.querySelector(`[data-fila="${clave}"]`)
  if (!nodo) throw new Error(`No existe la fila "${clave}"`)
  return within(nodo as HTMLElement)
}

/** El panel de la pestana activa, para no mirar lo que esta oculto. */
async function panelActivo() {
  const pestana = await screen.findByRole('tab', { selected: true })
  const panel = document.getElementById(pestana.getAttribute('aria-controls') ?? '')
  if (!panel) throw new Error('La pestana no apunta a su panel')
  return within(panel)
}

/**
 * Cuenta las peticiones a un path, para probar que no se piden de mas.
 *
 * Devuelve tambien `dispose`: un listener de `server.events` sobrevive a
 * `resetHandlers()`, asi que sin quitarlo el contador de un test contaminaria
 * los siguientes.
 */
function contarPeticiones(path: string) {
  let total = 0
  const listener = ({ request }: { request: Request }) => {
    if (new URL(request.url).pathname === path) total += 1
  }

  server.events.on('request:start', listener)

  return {
    total: () => total,
    dispose: () => server.events.removeListener('request:start', listener),
  }
}

let limpiarContadores: Array<() => void> = []

afterEach(() => {
  server.resetHandlers()
  limpiarContadores.forEach((limpiar) => limpiar())
  limpiarContadores = []
})

describe('UsuarioDetallePage (RFA02)', () => {
  it('muestra nombre, codigo y estado en el encabezado', async () => {
    renderizar()

    // El encabezado de la tarjeta de perfil tambien es un heading, asi que el
    // mismo helper lo acota: aca "Alumno" y "Activo" son los del resumen.
    const cabecera = await tarjeta('Ana Quispe Huaman')

    // "AQ": las dos primeras palabras del nombre, como en el carnet.
    expect(cabecera.getByText('AQ')).toBeInTheDocument()
    expect(cabecera.getByText('20241001')).toBeInTheDocument()
    expect(cabecera.getByText('Alumno')).toBeInTheDocument()
    expect(cabecera.getByText('Activo')).toBeInTheDocument()
  })

  it('muestra los datos personales del paso 2 de RFA02', async () => {
    renderizar()

    const datos = await tarjeta('Datos personales')

    expect(datos.getByText('20241001')).toBeInTheDocument()
    expect(datos.getByText('ana.quispe@utp.edu.pe')).toBeInTheDocument()
    expect(datos.getByText('910000000')).toBeInTheDocument()
    expect(datos.getByText('Alumno')).toBeInTheDocument()
    expect(datos.getByText('Activo')).toBeInTheDocument()
  })

  it('muestra el DNI, la licencia y el CONADIS completos (RNF12 es del backend)', async () => {
    renderizar()

    const datos = await tarjeta('Datos personales')

    // RNF12 pide cifrarlos en la base de datos, no ocultarlos en pantalla: el
    // paso 2 de RFA02 los lista como parte del perfil y el administrador los
    // necesita para verificar la identidad de quien estaciona.
    expect(datos.getByText('70000000')).toBeInTheDocument()
    expect(datos.getByText('Q20000000')).toBeInTheDocument()
    expect(datos.getByText('CD-01000')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /datos sensibles/i })).not.toBeInTheDocument()
  })

  it('lista los vehiculos y marca el principal y el que esta adentro', async () => {
    renderizar()

    await tarjeta('Vehiculos registrados')
    const vehiculo = fila('veh-01-1')

    expect(vehiculo.getByText('ABC-123')).toBeInTheDocument()
    expect(vehiculo.getByText(/Toyota Yaris/)).toBeInTheDocument()
    expect(vehiculo.getByText('Vehiculo principal')).toBeInTheDocument()
    // La plaza es la misma que muestra el Monitor (RFA03): si divergieran, el
    // panelaria contradictorio.
    expect(vehiculo.getByText(/Adentro en A-02/)).toBeInTheDocument()
  })

  it('avisa cuando el usuario no tiene vehiculos registrados', async () => {
    renderizar('usr-04')

    expect(
      await screen.findByText('Este usuario no tiene vehiculos registrados'),
    ).toBeInTheDocument()
  })

  it('distingue el ingreso abierto de los ya cerrados en el historial', async () => {
    renderizar()

    const abierto = await panelActivo()
    await abierto.findByText('Permanencia')

    const ingreso = fila('acc-01-01')
    expect(ingreso.getByText('A-02')).toBeInTheDocument()
    expect(ingreso.getByText('ABC-123')).toBeInTheDocument()
    // El ingreso abierto dice "Dentro" como estado y tambien en la columna
    // Salida, porque no tiene una: son dos respuestas al mismo dato.
    expect(ingreso.getAllByText('Dentro')).toHaveLength(2)
    expect(ingreso.queryByText('Finalizado')).not.toBeInTheDocument()

    const cerrado = fila('acc-01-02')
    expect(cerrado.getByText('Finalizado')).toBeInTheDocument()
  })

  it('pagina el historial de accesos en el servidor', async () => {
    const usuario = userEvent.setup()
    renderizar()

    const panel = await panelActivo()
    expect(await panel.findByText(textoPaginacion('1-10 de 12'))).toBeInTheDocument()
    expect(document.querySelector('[data-fila="acc-01-11"]')).toBeNull()

    await usuario.click(screen.getByRole('button', { name: 'Pagina siguiente' }))

    expect(await panel.findByText(textoPaginacion('11-12 de 12'))).toBeInTheDocument()
    expect(document.querySelector('[data-fila="acc-01-01"]')).toBeNull()
    expect(document.querySelector('[data-fila="acc-01-11"]')).not.toBeNull()
  })

  it('no pide el historial de reservas hasta que se abre su pestana', async () => {
    const peticiones = contarPeticiones('/api/usuarios/usr-01/reservas')
    limpiarContadores.push(peticiones.dispose)

    renderizar()

    await screen.findByText(textoPaginacion('1-10 de 12'))

    expect(peticiones.total()).toBe(0)
  })

  it('cambia al historial de reservas y lo pagina en el servidor', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Ana Quispe Huaman' })
    await usuario.click(screen.getByRole('tab', { name: /Reservas/ }))

    const panel = await panelActivo()
    expect(await panel.findByText(textoPaginacion('1-10 de 13'))).toBeInTheDocument()

    // La primera reserva es la unica viva: es la que el usuario tiene en curso.
    expect(fila('res-01-01').getByText('Activa')).toBeInTheDocument()
    expect(panel.getAllByText('Expirada').length).toBeGreaterThan(0)
    expect(panel.getAllByText('Completada').length).toBeGreaterThan(0)

    await usuario.click(screen.getByRole('button', { name: 'Pagina siguiente' }))

    expect(await panel.findByText(textoPaginacion('11-13 de 13'))).toBeInTheDocument()
  })

  it('vuelve a la primera pagina del historial al cambiar de pestana', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Ana Quispe Huaman' })
    await usuario.click(screen.getByRole('button', { name: 'Pagina siguiente' }))
    expect(await screen.findByText(textoPaginacion('11-12 de 12'))).toBeInTheDocument()

    await usuario.click(screen.getByRole('tab', { name: /Reservas/ }))
    expect(await screen.findByText(textoPaginacion('1-10 de 13'))).toBeInTheDocument()

    await usuario.click(screen.getByRole('tab', { name: /Accesos/ }))
    expect(await screen.findByText(textoPaginacion('1-10 de 12'))).toBeInTheDocument()
  })

  it('mueve el foco entre pestanas con el teclado', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Ana Quispe Huaman' })
    screen.getByRole('tab', { name: /Accesos/ }).focus()

    await usuario.keyboard('{ArrowRight}')

    const reservas = screen.getByRole('tab', { name: /Reservas/ })
    expect(reservas).toHaveAttribute('aria-selected', 'true')
    expect(reservas).toHaveFocus()
  })

  it('distingue un usuario inexistente de un fallo del servidor', async () => {
    renderizar('usr-999')

    expect(await screen.findByText('Ese usuario no existe')).toBeInTheDocument()
    expect(screen.queryByText('No se pudieron cargar los datos')).not.toBeInTheDocument()
  })

  it('muestra error con opcion de reintentar (E2) y recupera el perfil', async () => {
    const usuario = userEvent.setup()
    server.use(
      http.get('/api/usuarios/:id', () =>
        HttpResponse.json({ message: 'Fallo simulado del servidor' }, { status: 500 }),
      ),
    )

    renderizar()

    expect(await screen.findByText('No se pudieron cargar los datos')).toBeInTheDocument()

    server.resetHandlers()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Ana Quispe Huaman' })).toBeInTheDocument()
  })

  it('vuelve al listado de usuarios', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Ana Quispe Huaman' })
    await usuario.click(screen.getByRole('button', { name: 'Volver a usuarios' }))

    expect(await screen.findByText('Listado de usuarios')).toBeInTheDocument()
  })
})
