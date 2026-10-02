import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Tabs, type PanelTab } from './Tabs'

/**
 * Primitivo de pestanas. Lo usan RFA02, RFA05, RFA07 y RFA12, asi que un fallo
 * aqui se repite en cuatro vistas.
 *
 * Se prueba controlado, como lo usa la vista real: el estado de la pestana
 * activa vive afuera y el primitivo avisa el cambio. Asi el test verifica el
 * contrato, no una copia interna de la logica.
 */

const paneles: PanelTab[] = [
  { id: 'accesos', etiqueta: 'Accesos', conteo: 12, contenido: <p>Tabla de accesos</p> },
  { id: 'reservas', etiqueta: 'Reservas', conteo: 13, contenido: <p>Tabla de reservas</p> },
]

/** Envoltorio minimo: controlado, como la vista. */
function Contenedor({ alCambiar }: { alCambiar?: (activa: string) => void }) {
  const [activa, setActiva] = useState('accesos')

  return (
    <Tabs
      etiquetaGrupo="Historiales de Ana Quispe Huaman"
      activa={activa}
      onCambio={(id) => {
        setActiva(id)
        alCambiar?.(id)
      }}
      paneles={paneles}
    />
  )
}

function renderizar(alCambiar?: (activa: string) => void) {
  render(<Contenedor alCambiar={alCambiar} />)
}

const pestanaDe = (nombre: RegExp) => screen.getByRole('tab', { name: nombre })

describe('Tabs', () => {
  it('muestra la pestana activa y su contenido', () => {
    renderizar()

    expect(pestanaDe(/Accesos/)).toHaveAttribute('aria-selected', 'true')
    expect(pestanaDe(/Reservas/)).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('Tabla de accesos')).toBeInTheDocument()
    expect(screen.queryByText('Tabla de reservas')).not.toBeInTheDocument()
  })

  it('cambia de pestana al hacer clic y avisa el cambio', async () => {
    const usuario = userEvent.setup()
    const cambios: string[] = []
    renderizar((id) => cambios.push(id))

    await usuario.click(pestanaDe(/Reservas/))

    expect(pestanaDe(/Reservas/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Tabla de reservas')).toBeInTheDocument()
    expect(cambios).toEqual(['reservas'])
  })

  it('muestra el conteo junto a la etiqueta, nunca en su lugar', () => {
    renderizar()

    // El nombre accesible incluye el conteo porque es texto dentro del boton.
    expect(pestanaDe(/Accesos/)).toHaveTextContent('Accesos12')
  })

  it('enlaza cada pestana con su panel para lectores de pantalla', () => {
    renderizar()

    const pestana = pestanaDe(/Accesos/)
    const panel = document.getElementById(pestana.getAttribute('aria-controls') ?? '')
    if (!panel) throw new Error('aria-controls no apunta a un panel')

    expect(panel).toHaveAttribute('aria-labelledby', pestana.id)
    expect(panel).toHaveAttribute('role', 'tabpanel')
  })

  it('nombra el grupo de pestanas para lectores de pantalla', () => {
    renderizar()

    expect(screen.getByRole('tablist')).toHaveAccessibleName('Historiales de Ana Quispe Huaman')
  })

  it('lleva el foco a la pestana siguiente con ArrowRight y la envuelve', async () => {
    const usuario = userEvent.setup()
    renderizar()

    pestanaDe(/Accesos/).focus()
    await usuario.keyboard('{ArrowRight}')

    expect(pestanaDe(/Reservas/)).toHaveFocus()
    expect(pestanaDe(/Reservas/)).toHaveAttribute('aria-selected', 'true')

    await usuario.keyboard('{ArrowRight}')

    // Ultima pestana: la siguiente es la primera.
    expect(pestanaDe(/Accesos/)).toHaveFocus()
  })

  it('lleva el foco a la pestana anterior con ArrowLeft y la envuelve', async () => {
    const usuario = userEvent.setup()
    renderizar()

    pestanaDe(/Accesos/).focus()
    await usuario.keyboard('{ArrowLeft}')

    // Primera pestana: la anterior es la ultima.
    expect(pestanaDe(/Reservas/)).toHaveFocus()
  })

  it('va a los extremos con Home y End', async () => {
    const usuario = userEvent.setup()
    renderizar()

    pestanaDe(/Accesos/).focus()

    await usuario.keyboard('{End}')
    expect(pestanaDe(/Reservas/)).toHaveFocus()

    await usuario.keyboard('{Home}')
    expect(pestanaDe(/Accesos/)).toHaveFocus()
  })

  it('deja el foco solo en la pestana activa', () => {
    renderizar()

    // Solo la activa es alcanzable con Tab; las demas se eligen con flechas.
    expect(pestanaDe(/Accesos/)).toHaveAttribute('tabindex', '0')
    expect(pestanaDe(/Reservas/)).toHaveAttribute('tabindex', '-1')
  })

  it('oculta el panel de la pestana inactiva en vez de solo vaciarlo', () => {
    renderizar()

    const pestana = pestanaDe(/Accesos/)
    const activo = document.getElementById(pestana.getAttribute('aria-controls') ?? '')
    const inactivo = document.getElementById(
      pestanaDe(/Reservas/).getAttribute('aria-controls') ?? '',
    )

    expect(activo).not.toHaveAttribute('hidden')
    expect(inactivo).toHaveAttribute('hidden')
  })
})
