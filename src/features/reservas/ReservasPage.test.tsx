import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReservasPage } from './ReservasPage'
import * as reservasApi from './reservas.api'
import { AvisosProvider } from '@/components/ui/Avisos'
import userEvent from '@testing-library/user-event'

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
