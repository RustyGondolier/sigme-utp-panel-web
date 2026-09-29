import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

/**
 * El motivo obligatorio no puede quedar en manos de cada vista: si una forgets
 * deshabilitar el boton, la operacion destructiva se ejecuta sin justificacion y
 * el audit log (RFA10) queda incompleto. Este test congela esa garantia una vez
 * para RFA06, RFA08 y RFA12.
 */
function montar(extra: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const props = {
    abierto: true,
    onCerrar: vi.fn(),
    onConfirmar: vi.fn(),
    titulo: 'Cancelar reserva',
    descripcion: 'La plaza quedara libre y el usuario recibe un aviso.',
    ...extra,
  }
  const { rerender } = render(<ConfirmDialog {...props} />)
  return { ...props, rerender }
}

describe('ConfirmDialog con motivo obligatorio', () => {
  it('inicia con el boton de confirmar deshabilitado', () => {
    montar()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('sigue deshabilitado con un motivo demasiado corto', async () => {
    const usuario = userEvent.setup()
    montar()
    await usuario.type(screen.getByLabelText(/motivo/i), 'corto')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('habilita la confirmacion con 10 caracteres o mas', async () => {
    const usuario = userEvent.setup()
    const { onConfirmar } = montar()
    await usuario.type(screen.getByLabelText(/motivo/i), 'Ingreso duplicado detectado')

    const boton = screen.getByRole('button', { name: 'Confirmar' })
    expect(boton).toBeEnabled()
    await usuario.click(boton)
    expect(onConfirmar).toHaveBeenCalledWith('Ingreso duplicado detectado')
  })

  it('muestra el error de longitud solo despues de salir del campo', async () => {
    const usuario = userEvent.setup()
    montar()
    const campo = screen.getByLabelText(/motivo/i)

    await usuario.type(campo, 'corto')
    // Mientras se escribe no se interrumpe con el error.
    expect(screen.queryByText(/al menos 10 caracteres/i)).not.toBeInTheDocument()

    await usuario.tab()
    expect(screen.getByText(/al menos 10 caracteres/i)).toBeInTheDocument()
  })

  it('limpia el motivo al reabrirse, sin arrastrar el anterior', async () => {
    const usuario = userEvent.setup()
    const { rerender, onConfirmar } = montar()

    await usuario.type(screen.getByLabelText(/motivo/i), 'Motivo de la primera vez')
    expect(screen.getByLabelText(/motivo/i)).toHaveValue('Motivo de la primera vez')

    // Cerrar y reabrir debe dejar el formulario limpio.
    rerender(
      <ConfirmDialog
        abierto={false}
        onCerrar={vi.fn()}
        onConfirmar={onConfirmar}
        titulo="Cancelar reserva"
      />,
    )
    rerender(
      <ConfirmDialog
        abierto
        onCerrar={vi.fn()}
        onConfirmar={onConfirmar}
        titulo="Cancelar reserva"
      />,
    )

    expect(screen.getByLabelText(/motivo/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('expone que el motivo queda en el audit log', () => {
    montar()
    expect(screen.getByText(/audit log/i)).toBeInTheDocument()
  })
})
