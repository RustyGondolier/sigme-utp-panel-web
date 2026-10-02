import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReservasPage } from './ReservasPage'
import * as reservasApi from './reservas.api'
import { AvisosProvider } from '@/components/ui/Avisos'

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
