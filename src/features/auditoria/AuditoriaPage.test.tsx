import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuditoriaPage } from './AuditoriaPage'
import * as auditoriaApi from './auditoria.api'

vi.mock('./auditoria.api')

describe('AuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(auditoriaApi.listarAuditoria).mockResolvedValue({
      items: [],
    })
  })

  it('aplica filtros de auditoria al cambiar los controles', async () => {
    const usuario = userEvent.setup()

    render(<AuditoriaPage />)

    await screen.findByText('No hay registros de auditoria.')

    await usuario.selectOptions(screen.getByLabelText('Filtrar por administrador'), 'adm-001')

    expect(auditoriaApi.listarAuditoria).toHaveBeenLastCalledWith(
      expect.objectContaining({
        adminId: 'adm-001',
      }),
    )

    await usuario.selectOptions(screen.getByLabelText('Filtrar por accion'), 'CANCELAR_RESERVA')

    expect(auditoriaApi.listarAuditoria).toHaveBeenLastCalledWith(
      expect.objectContaining({
        adminId: 'adm-001',
        accion: 'CANCELAR_RESERVA',
      }),
    )
  })
})
