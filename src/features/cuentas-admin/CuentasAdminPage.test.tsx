import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { AvisosProvider } from '@/components/ui'
import { CUENTAS_ADMIN_MOCK } from '@/mocks/fixtures'
import { server } from '@/mocks/server'
import { CuentasAdminPage } from './CuentasAdminPage'

/**
 * RFA12 de punta a punta contra MSW, sin el router: la vista no navega, y
 * `memoryRouter` solo servia para envolverla sin efecto.
 *
 * Lo que se prueba aqui es el contrato de la pantalla, no la forma del codigo:
 * la tabla lista las cuentas, el alta crea, la desactivacion pide motivo y deja
 * a la cuenta sin sesion, y las excepciones E1, E2 y E3 se sienten sin llegar a
 * la peticion. E4 no se puede provocar desde aca (mientras haya dos activas mas,
 * la propia cuenta siempre se adelanta), y por eso vive en `cuentas.reglas.test`.
 *
 * `setup.ts` reinicia el estado de MSW antes de cada test: sin eso, desactivar
 * una cuenta en un caso leaked a todos los que vienen despues.
 */

function nuevoQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderizar() {
  return render(
    <QueryClientProvider client={nuevoQueryClient()}>
      <AvisosProvider>
        <CuentasAdminPage />
      </AvisosProvider>
    </QueryClientProvider>,
  )
}

const dialogo = () => within(screen.getByRole('dialog'))

/** Espera a que la lista haya pagado. */
function esperarTabla() {
  return screen.findByRole('table')
}

function botonEnFila(usuario: string, nombre: RegExp) {
  return within(filaDe(usuario)).getByRole('button', { name: nombre })
}

/** Fila por usuario, con coincidencia exacta en la primera celda. */
function filaDe(usuario: string): HTMLElement {
  const fila = screen
    .getAllByRole('row')
    .find((nodo) => nodo.querySelector('td, th')?.textContent?.trim().startsWith(usuario))

  if (!fila) throw new Error(`No hay fila para "${usuario}"`)
  return fila
}

/** Estado legible de una fila, que es como lo lee el administrador. */
function estadoEnFila(usuario: string) {
  const fila = within(filaDe(usuario))
  return fila.getAllByText(/Activo|Bloqueado/)[0].textContent
}

async function desactivar(usuario: string, motivo: string) {
  const u = userEvent.setup()
  await u.click(botonEnFila(usuario, /desactivar/i))
  await screen.findByRole('dialog')
  await u.type(dialogo().getByRole('textbox'), motivo)
  await u.click(dialogo().getByRole('button', { name: /desactivar/i }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('CuentasAdminPage (RFA12)', () => {
  it('lista las cuentas con su estado y avisa que son N', async () => {
    renderizar()

    await esperarTabla()

    expect(filaDe('mgomez')).toBeInTheDocument()
    expect(filaDe('lparedes')).toBeInTheDocument()
    expect(screen.getByText(`${CUENTAS_ADMIN_MOCK.length} cuentas`)).toBeInTheDocument()
    expect(estadoEnFila('lparedes')).toBe('Bloqueado')
    expect(estadoEnFila('rsoto')).toBe('Activo')
  })

  it('marca la cuenta en sesion para que el administrador se ubique', async () => {
    renderizar()

    await esperarTabla()

    expect(screen.getByText('(tu cuenta)')).toBeInTheDocument()
  })

  it('no ofrece desactivar la cuenta propia y explica por que (E2)', async () => {
    renderizar()

    await esperarTabla()

    expect(botonEnFila('admin', /desactivar/i)).toBeDisabled()
    expect(
      screen.getByText(/no puedes desactivar la cuenta con la que iniciaste sesion/i),
    ).toBeInTheDocument()
  })

  it('no ofrece desactivar una cuenta con reserva activa y explica por que (E3)', async () => {
    renderizar()

    await esperarTabla()

    expect(botonEnFila('mgomez', /desactivar/i)).toBeDisabled()
    expect(screen.getByText(/tiene una reserva de plaza activa/i)).toBeInTheDocument()
  })

  it('da de alta una cuenta y la muestra en la lista', async () => {
    const u = userEvent.setup()
    renderizar()
    await esperarTabla()

    await u.click(screen.getByRole('button', { name: /nueva cuenta/i }))
    await u.type(dialogo().getByLabelText(/nombre de usuario/i), 'aperez')
    await u.type(dialogo().getByLabelText(/correo institucional/i), 'aperez@utp.edu.pe')
    await u.type(dialogo().getByLabelText(/contrasena temporal/i), 'utp2026')
    await u.click(dialogo().getByRole('button', { name: /crear cuenta/i }))

    await esperarTabla()
    await waitFor(() => expect(filaDe('aperez')).toBeInTheDocument())
  })

  it('rechaza un alta sin correo institucional antes de pegarle al servidor', async () => {
    const u = userEvent.setup()
    renderizar()
    await esperarTabla()

    await u.click(screen.getByRole('button', { name: /nueva cuenta/i }))
    await u.type(dialogo().getByLabelText(/nombre de usuario/i), 'aperez')
    await u.type(dialogo().getByLabelText(/correo institucional/i), 'aperez@gmail.com')
    await u.click(dialogo().getByRole('button', { name: /crear cuenta/i }))

    // Un alert por campo invalido, asi que se busca el mensaje del campo y no un
    // rol generico: la asercion tiene que decir que falla el correo.
    expect(await dialogo().findByText(/usa el correo institucional/i)).toBeInTheDocument()
    expect(dialogo().queryByRole('table')).not.toBeInTheDocument()
  })

  it('E1: el servidor rechaza un usuario repetido y el modal lo muestra', async () => {
    const u = userEvent.setup()
    renderizar()
    await esperarTabla()

    await u.click(screen.getByRole('button', { name: /nueva cuenta/i }))
    await u.type(dialogo().getByLabelText(/nombre de usuario/i), 'RSOTO')
    await u.type(dialogo().getByLabelText(/correo institucional/i), 'otro@utp.edu.pe')
    await u.type(dialogo().getByLabelText(/contrasena temporal/i), 'utp2026')
    await u.click(dialogo().getByRole('button', { name: /crear cuenta/i }))

    expect(await dialogo().findByRole('alert')).toHaveTextContent(/ya esta registrado/i)
    // El formulario sigue abierto: perder lo escrito seria peor que el error.
    expect(dialogo().getByLabelText(/nombre de usuario/i)).toHaveValue('RSOTO')
  })

  it('desactiva una cuenta pidiendo el motivo (ConfirmDialog)', async () => {
    renderizar()

    await esperarTabla()
    await desactivar('rsoto', 'Cedula de traspaso delarea')

    await waitFor(() => expect(estadoEnFila('rsoto')).toBe('Bloqueado'))
  })

  it('reactiva una cuenta bloqueada', async () => {
    const u = userEvent.setup()
    renderizar()
    await esperarTabla()

    await u.click(botonEnFila('lparedes', /reactivar/i))

    await waitFor(() => expect(estadoEnFila('lparedes')).toBe('Activo'))
  })

  it('el motivo no se puede confirmar con menos de 10 caracteres', async () => {
    const u = userEvent.setup()
    renderizar()
    await esperarTabla()

    await u.click(botonEnFila('rsoto', /desactivar/i))
    await screen.findByRole('dialog')
    await u.type(dialogo().getByRole('textbox'), 'corta')
    expect(dialogo().getByRole('button', { name: /desactivar/i })).toBeDisabled()
  })

  it('E4: con una sola cuenta activa la vista bloquea la desactivacion', async () => {
    // Con una unica cuenta activa, la propia deja de estar en juego y lo que
    // pesa es E4. La vista lo siente antes de la peticion; que el servidor
    // tambien lo niegue se prueba en `cuentas.api.test.ts`.
    server.use(
      http.get('/api/cuentas-admin', () =>
        HttpResponse.json({
          items: [{ ...CUENTAS_ADMIN_MOCK[2], esLaCuentaEnSesion: false }],
        }),
      ),
    )
    renderizar()
    await esperarTabla()

    expect(botonEnFila('rsoto', /desactivar/i)).toBeDisabled()
    expect(screen.getByText(/ultima cuenta de administrador activa/i)).toBeInTheDocument()
  })
})
