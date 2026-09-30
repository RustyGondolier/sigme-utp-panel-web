import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { UsuariosPage } from './UsuariosPage'

/**
 * Criterios de aceptacion de RFA01. El mock de /api/usuarios devuelve 25
 * usuarios (10 por pagina) con tipos y estados variados, suficiente para
 * probar paginacion y filtros server-side con datos reales del contrato.
 */

function nuevoQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function DetalleStub() {
  const { id } = useParams()
  return <div>Detalle del usuario {id}</div>
}

/**
 * La paginacion pinta "1-10 de 25" repartido en varios spans (DataTable),
 * y el matcher por defecto de RTL solo lee los nodos de texto directos. Este
 * matcher compara el textContent completo, que es como el usuario lo lee.
 */
const textoPaginacion =
  (texto: string) =>
  (_contenido: string, elemento: Element | null): boolean =>
    elemento?.textContent?.replace(/\s+/g, ' ').trim() === texto

function renderizar() {
  return render(
    <QueryClientProvider client={nuevoQueryClient()}>
      <MemoryRouter initialEntries={['/usuarios']}>
        <Routes>
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/usuarios/:id" element={<DetalleStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('UsuariosPage (RFA01)', () => {
  it('muestra codigo, nombre, correo y fecha de registro', async () => {
    renderizar()

    expect(await screen.findByText('Ana Quispe Huaman')).toBeInTheDocument()
    expect(screen.getByText('20241001')).toBeInTheDocument()
    expect(screen.getByText('ana.quispe@utp.edu.pe')).toBeInTheDocument()
    expect(screen.getByText('Codigo')).toBeInTheDocument()
    expect(screen.getByText('Nombre completo')).toBeInTheDocument()
    expect(screen.getByText('Fecha de registro')).toBeInTheDocument()
  })

  it('pagina en el servidor y actualiza el rango de la pagina', async () => {
    const usuario = userEvent.setup()
    renderizar()

    expect(await screen.findByText(textoPaginacion('1-10 de 25'))).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Pagina siguiente' }))

    expect(await screen.findByText('Carmen Rojas Aguilar')).toBeInTheDocument()
    expect(screen.getByText(textoPaginacion('11-20 de 25'))).toBeInTheDocument()
    expect(screen.queryByText('Ana Quispe Huaman')).not.toBeInTheDocument()
  })

  it('filtra por tipo de usuario', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Ana Quispe Huaman')
    await usuario.selectOptions(screen.getByLabelText('Filtrar por tipo de usuario'), 'DOCENTE')

    expect(await screen.findByText('Maria Gutierrez Salazar')).toBeInTheDocument()
    expect(screen.getByText('Jorge Vasquez Ortiz')).toBeInTheDocument()
    expect(screen.queryByText('Ana Quispe Huaman')).not.toBeInTheDocument()
  })

  it('filtra por estado de usuario', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Ana Quispe Huaman')
    await usuario.selectOptions(screen.getByLabelText('Filtrar por estado de usuario'), 'BLOQUEADO')

    expect(await screen.findByText('Jose Luis Ramos Paredes')).toBeInTheDocument()
    expect(screen.getByText('Carmen Rojas Aguilar')).toBeInTheDocument()
    expect(screen.queryByText('Ana Quispe Huaman')).not.toBeInTheDocument()
  })

  it('busca por nombre sin distincion de mayusculas', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Ana Quispe Huaman')
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar usuarios' }), 'ana')

    expect(await screen.findByText(textoPaginacion('1-1 de 1'))).toBeInTheDocument()
    expect(screen.getByText('Ana Quispe Huaman')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Mendoza Rojas')).not.toBeInTheDocument()
  })

  it('busca por codigo institucional', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Ana Quispe Huaman')
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar usuarios' }), '20241003')

    expect(await screen.findByText(textoPaginacion('1-1 de 1'))).toBeInTheDocument()
    expect(screen.getByText('Maria Gutierrez Salazar')).toBeInTheDocument()
    expect(screen.queryByText('Ana Quispe Huaman')).not.toBeInTheDocument()
  })

  it('muestra mensaje informativo cuando no hay resultados (E1)', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Ana Quispe Huaman')
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar usuarios' }), 'zzz-nadie')

    expect(await screen.findByText('No hay usuarios con esos filtros')).toBeInTheDocument()
    expect(screen.queryByText(textoPaginacion('1-10 de 25'))).not.toBeInTheDocument()
  })

  it('muestra error con opcion de reintentar (E2) y recupera la lista', async () => {
    const usuario = userEvent.setup()
    server.use(
      http.get('/api/usuarios', () =>
        HttpResponse.json({ message: 'Fallo simulado del servidor' }, { status: 500 }),
      ),
    )

    renderizar()

    expect(await screen.findByText('No se pudieron cargar los datos')).toBeInTheDocument()
    expect(screen.getByText('Fallo simulado del servidor')).toBeInTheDocument()

    server.resetHandlers()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Ana Quispe Huaman')).toBeInTheDocument()
  })

  it('abre el detalle del usuario al seleccionar una fila (paso 5)', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Ana Quispe Huaman')
    await usuario.click(screen.getByText('Ana Quispe Huaman'))

    expect(await screen.findByText('Detalle del usuario usr-01')).toBeInTheDocument()
  })

  it('limpiar filtros restaura el listado completo', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Ana Quispe Huaman')
    await usuario.selectOptions(screen.getByLabelText('Filtrar por estado de usuario'), 'BLOQUEADO')
    await screen.findByText('Jose Luis Ramos Paredes')

    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(await screen.findByText(textoPaginacion('1-10 de 25'))).toBeInTheDocument()
    expect(screen.getByText('Ana Quispe Huaman')).toBeInTheDocument()
  })
})
