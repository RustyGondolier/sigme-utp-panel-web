import { describe, expect, it } from 'vitest'
import { FILTROS_INICIALES, hayFiltros, rangoDelDia, rangoInvertido } from './accesos.filtros'

/**
 * Reglas de RFA07 que no se ven mirando la pantalla.
 *
 * La que importa de verdad es la conversion del rango de fechas: si el backend
 * recibiera `2026-09-05` tal cual, lo leeria como medianoche UTC y en Lima
 * (UTC-5) el filtro arrancaria cinco horas tarde, dejando fuera del rango la
 * tarde del 5 que el administrador acaba de pedir.
 */

describe('rangoDelDia', () => {
  it('acota el dia local entero, de las 00:00:00.000 a las 23:59:59.999', () => {
    const { desde, hasta } = rangoDelDia('2026-09-05', '2026-09-05')

    expect(desde).toBe(new Date(2026, 8, 5, 0, 0, 0, 0).toISOString())
    expect(hasta).toBe(new Date(2026, 8, 5, 23, 59, 59, 999).toISOString())
  })

  it('interpreta la fecha en hora local y no en UTC', () => {
    // Un `new Date('2026-09-05')` a secas seria medianoche UTC. Con el huso de
    // Lima eso son las 19:00 del 4, y el filtro arrancaria un dia antes.
    const { desde } = rangoDelDia('2026-09-05', '')

    expect(desde).not.toBe(new Date('2026-09-05').toISOString())
    expect(new Date(desde as string).getHours()).toBe(0)
    expect(new Date(desde as string).getDate()).toBe(5)
  })

  it('omite el extremo que el administrador no eligio, en vez de inventarlo', () => {
    expect(rangoDelDia('', '2026-09-05')).toEqual({
      desde: undefined,
      hasta: new Date(2026, 8, 5, 23, 59, 59, 999).toISOString(),
    })
    expect(rangoDelDia('2026-09-01', '')).toEqual({
      desde: new Date(2026, 8, 1, 0, 0, 0, 0).toISOString(),
      hasta: undefined,
    })
  })

  it('no acota nada cuando no hay ninguna fecha', () => {
    expect(rangoDelDia('', '')).toEqual({ desde: undefined, hasta: undefined })
  })
})

describe('rangoInvertido', () => {
  it('avisa cuando la fecha desde es posterior a la hasta', () => {
    expect(rangoInvertido({ ...FILTROS_INICIALES, desde: '2026-09-10', hasta: '2026-09-05' })).toBe(
      true,
    )
  })

  it('no se dispara con un rango ordenado, ni con un solo extremo', () => {
    expect(rangoInvertido({ ...FILTROS_INICIALES, desde: '2026-09-05', hasta: '2026-09-10' })).toBe(
      false,
    )
    expect(rangoInvertido({ ...FILTROS_INICIALES, desde: '2026-09-05', hasta: '2026-09-05' })).toBe(
      false,
    )
    expect(rangoInvertido({ ...FILTROS_INICIALES, desde: '2026-09-05' })).toBe(false)
    expect(rangoInvertido(FILTROS_INICIALES)).toBe(false)
  })
})

describe('hayFiltros', () => {
  it('es falso solo cuando no se toco ninguno de los cinco filtros', () => {
    expect(hayFiltros(FILTROS_INICIALES)).toBe(false)
    expect(hayFiltros({ ...FILTROS_INICIALES, desde: '2026-09-05' })).toBe(true)
    expect(hayFiltros({ ...FILTROS_INICIALES, busqueda: 'ana' })).toBe(true)
    expect(hayFiltros({ ...FILTROS_INICIALES, cocheraId: 'coch-01' })).toBe(true)
    expect(hayFiltros({ ...FILTROS_INICIALES, plazaId: 'pla-02' })).toBe(true)
  })
})
