import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaceholderPage } from './PlaceholderPage'

describe('PlaceholderPage', () => {
  it('muestra el codigo del requerimiento y el titulo', () => {
    render(<PlaceholderPage rfa="RFA03" titulo="Monitor de plazas" />)

    expect(screen.getByText('RFA03')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Monitor de plazas' })).toBeInTheDocument()
  })
})
