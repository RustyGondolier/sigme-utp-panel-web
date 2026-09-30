import { describe, expect, it } from 'vitest'
import { ESTADOS, clasesEstadoPlaza, etiquetaEstado } from '@/components/shared/estadoPlaza'
import type { EstadoPlaza } from '@/lib/types/dominio'

/**
 * RFA03 exige los cuatro estados y la guia de accesibilidad exige que ninguno
 * se distinga solo por color. Este test congela esa garantia: cada estado
 * necesita texto, icono y una tinta propia, y el gris necesita ademas borde
 * punteado.
 */
describe('estados de plaza (RFA03)', () => {
  const estados: EstadoPlaza[] = ['LIBRE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO']

  it('cubre los cuatro estados exigidos y ninguno mas', () => {
    expect(Object.keys(ESTADOS).sort()).toEqual([...estados].sort())
  })

  it('cada estado tiene etiqueta visible, no solo color', () => {
    for (const estado of estados) {
      expect(ESTADOS[estado].etiqueta, `${estado} sin etiqueta`).not.toBe('')
    }
  })

  it('cada estado tiene icono, relleno y tinta propios', () => {
    const iconos = new Set(estados.map((e) => ESTADOS[e].Icono))
    // Si dos estados compartieran icono, el color seria lo unico que los
    // distingue y habria que revisarlo de nuevo.
    expect(iconos.size, 'dos estados comparten icono').toBe(4)

    for (const estado of estados) {
      const c = ESTADOS[estado]
      expect(c.relleno, `${estado} sin relleno`).toMatch(/^bg-/)
      expect(c.tinta, `${estado} sin tinta`).toMatch(/^text-/)
      expect(c.borde, `${estado} sin borde`).toMatch(/border/)
    }
  })

  it('el sensor fuera de servicio se distingue ademas con borde punteado', () => {
    expect(ESTADOS.FUERA_DE_SERVICIO.borde).toContain('dashed')
  })

  it('el texto de los estados usa la variante -ink, no el color de marca', () => {
    // El verde UTP sobre blanco da 2.65:1 y el texto de marca da 8.1:1. La
    // diferencia entre `text-accent-600` y `text-accent-ink` es exactamente la
    // que hace legible la etiqueta.
    for (const estado of estados) {
      expect(ESTADOS[estado].tinta, `${estado} usa tinta sin sufijo`).toMatch(/-ink$/)
    }
  })

  it('las etiquetas legibles cubren los cuatro estados', () => {
    expect(etiquetaEstado('LIBRE')).toBe('Libre')
    expect(etiquetaEstado('OCUPADA')).toBe('Ocupada')
    expect(etiquetaEstado('RESERVADA')).toBe('Reservada')
    // Se nombra el sensor, no la plaza: el gris significa que el sensor fallo,
    // no que el lugar este ocupado.
    expect(etiquetaEstado('FUERA_DE_SERVICIO')).toBe('Sensor fuera de servicio')
  })

  it('clasesEstadoPlaza devuelve la configuracion del estado pedido', () => {
    expect(clasesEstadoPlaza('OCUPADA')).toBe(ESTADOS.OCUPADA)
  })
})
