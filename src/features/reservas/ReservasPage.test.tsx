import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReservasPage } from './ReservasPage'
import * as reservasApi from './reservas.api'
import { AvisosProvider } from '@/components/ui/Avisos'
import userEvent from '@testing-library/user-event'

const { socketMock } = vi.hoisted(() => ({
  socketMock: {
    connected: false,
    on: vi.fn(),
    onAny: vi.fn(),
    off: vi.fn(),
    offAny: vi.fn(),
    connect: vi.fn(),
  },
}))

vi.mock('@/lib/socket', () => ({
  socket: socketMock,
}))

vi.mock('./reservas.api')

describe('ReservasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra un estado vacio cuando no hay reservas activas', async () => {
    vi.mocked(reservasApi.listarReservas).mockResolvedValue({
      items: [],
    })

    render(
      <AvisosProvider>
        <ReservasPage />
      </AvisosProvider>,
    )

    expect(await screen.findByText('No hay reservas activas.')).toBeInTheDocument()
  })
})

it('muestra el detalle y permite iniciar la cancelacion al seleccionar una reserva', async () => {
  const usuario = userEvent.setup()

  vi.mocked(reservasApi.listarReservas).mockResolvedValue({
    items: [
      {
        id: 'res-01',
        usuarioId: 'usr-01',
        codigoUsuario: '20240001',
        nombreUsuario: 'Usuario prueba',
        cocheraId: 'coch-01',
        plazaId: 'pla-03',
        codigoPlaza: 'A-03',
        estado: 'ACTIVA',
        solicitadaEn: new Date(Date.now() - 5 * 60_000).toISOString(),
        venceEn: new Date(Date.now() + 25 * 60_000).toISOString(),
      },
    ],
  })

  render(
    <AvisosProvider>
      <ReservasPage />
    </AvisosProvider>,
  )

  const fila = await screen.findByText('Usuario prueba')
  await usuario.click(fila)

  expect(screen.getByText('Detalle de la reserva')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Cancelar reserva' })).toBeInTheDocument()
})

it('cancela una reserva cuando se confirma con un motivo valido', async () => {
  const usuario = userEvent.setup()

  vi.mocked(reservasApi.listarReservas).mockResolvedValue({
    items: [
      {
        id: 'res-01',
        usuarioId: 'usr-01',
        codigoUsuario: '20240001',
        nombreUsuario: 'Usuario prueba',
        cocheraId: 'coch-01',
        plazaId: 'pla-03',
        codigoPlaza: 'A-03',
        estado: 'ACTIVA',
        solicitadaEn: new Date(Date.now() - 5 * 60_000).toISOString(),
        venceEn: new Date(Date.now() + 25 * 60_000).toISOString(),
      },
    ],
  })

  vi.mocked(reservasApi.cancelarReserva).mockResolvedValue({
    id: 'res-01',
    usuarioId: 'usr-01',
    codigoUsuario: '20240001',
    nombreUsuario: 'Usuario prueba',
    cocheraId: 'coch-01',
    plazaId: 'pla-03',
    codigoPlaza: 'A-03',
    estado: 'CANCELADA_POR_ADMIN',
    solicitadaEn: new Date(Date.now() - 5 * 60_000).toISOString(),
    venceEn: new Date(Date.now() + 25 * 60_000).toISOString(),
  })

  render(
    <AvisosProvider>
      <ReservasPage />
    </AvisosProvider>,
  )

  await usuario.click(await screen.findByText('Usuario prueba'))
  await usuario.click(screen.getByRole('button', { name: 'Cancelar reserva' }))

  await usuario.type(screen.getByLabelText(/motivo/i), 'Reserva duplicada detectada')

  const botonesCancelar = screen.getAllByRole('button', {
    name: 'Cancelar reserva',
  })

  await usuario.click(botonesCancelar[botonesCancelar.length - 1])

  expect(reservasApi.cancelarReserva).toHaveBeenCalledWith('res-01', 'Reserva duplicada detectada')
})

it('recarga reservas cuando recibe un evento del socket', async () => {
  vi.mocked(reservasApi.listarReservas).mockResolvedValue({
    items: [],
  })

  render(
    <AvisosProvider>
      <ReservasPage />
    </AvisosProvider>,
  )

  await screen.findByText('No hay reservas activas.')

  expect(socketMock.onAny).toHaveBeenCalledTimes(1)

  const sincronizar = socketMock.onAny.mock.calls[0][0]

  vi.mocked(reservasApi.listarReservas).mockClear()

  await act(async () => {
    await sincronizar()
  })

  expect(reservasApi.listarReservas).toHaveBeenCalledTimes(1)
})
