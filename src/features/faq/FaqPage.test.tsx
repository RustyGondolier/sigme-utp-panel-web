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

it('reordena preguntas dentro de una categoria', async () => {
  const usuario = userEvent.setup()

  vi.mocked(faqApi.obtenerFaq).mockResolvedValue({
    categorias: [
      {
        id: 'cat-01',
        nombre: 'Reservas',
        orden: 1,
      },
    ],
    preguntas: [
      {
        id: 'faq-01',
        categoriaId: 'cat-01',
        pregunta: 'Primera pregunta',
        respuesta: 'Primera respuesta',
        orden: 1,
      },
      {
        id: 'faq-02',
        categoriaId: 'cat-01',
        pregunta: 'Segunda pregunta',
        respuesta: 'Segunda respuesta',
        orden: 2,
      },
    ],
  })

  vi.mocked(faqApi.reordenarPreguntas).mockResolvedValue(undefined)

  render(
    <AvisosProvider>
      <FaqPage />
    </AvisosProvider>,
  )

  await screen.findByText('Primera pregunta')

  const botonesBajar = screen.getAllByRole('button', { name: 'Bajar' })

  await usuario.click(botonesBajar[0])

  expect(faqApi.reordenarPreguntas).toHaveBeenCalledWith(['faq-02', 'faq-01'])
})
