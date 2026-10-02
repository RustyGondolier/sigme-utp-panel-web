import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from '@/components/ui/Avisos'
import { FaqPage } from './FaqPage'
import * as faqApi from './faq.api'

vi.mock('./faq.api')

describe('FaqPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(faqApi.obtenerFaq).mockResolvedValue({
      categorias: [],
      preguntas: [],
    })
  })

  it('permite crear una nueva categoria', async () => {
    const usuario = userEvent.setup()

    vi.mocked(faqApi.crearCategoria).mockResolvedValue({
      id: 'cat-01',
      nombre: 'Reservas',
      orden: 1,
    })

    render(
      <AvisosProvider>
        <FaqPage />
      </AvisosProvider>,
    )

    const campo = await screen.findByLabelText('Nombre de la nueva categoria')

    await usuario.type(campo, 'Reservas')
    await usuario.click(screen.getByRole('button', { name: 'Nueva categoria' }))

    expect(faqApi.crearCategoria).toHaveBeenCalledWith('Reservas')
    expect(await screen.findByRole('heading', { name: 'Reservas' })).toBeInTheDocument()
  })
})
