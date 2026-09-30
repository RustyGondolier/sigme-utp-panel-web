import { describe, expect, it } from 'vitest'
import {
  cuentaRegresiva,
  fecha,
  fechaHora,
  hora,
  nombreRol,
  porcentaje,
  tiempoTranscurrido,
} from '@/lib/formatters'

/**
 * Los formatters son el punto donde dos vistas dejan de mostrar la misma fecha
 * de forma distinta. Se prueban con fechas fijas, nunca con `new Date()`, para
 * que el test no dependa del dia en que corre.
 */
const AHORA = new Date('2026-09-27T14:35:00')

describe('tiempoTranscurrido', () => {
  it('usa segundos por debajo del minuto', () => {
    expect(tiempoTranscurrido('2026-09-27T14:34:12', AHORA)).toBe('48 s')
  })

  it('usa minutos por debajo de la hora y descarta los segundos', () => {
    // 13:57:10 -> 14:35:00 son 37 min 50 s; los 50 s no cuentan.
    expect(tiempoTranscurrido('2026-09-27T13:57:10', AHORA)).toBe('37 min')
  })

  it('usa horas y minutos, y solo horas cuando el resto es cero', () => {
    expect(tiempoTranscurrido('2026-09-27T12:20:00', AHORA)).toBe('2 h 15 min')
    expect(tiempoTranscurrido('2026-09-27T11:35:00', AHORA)).toBe('3 h')
  })

  it('usa dias despues de las 24 horas', () => {
    expect(tiempoTranscurrido('2026-09-25T12:35:00', AHORA)).toBe('2 d 2 h')
  })

  it('nunca devuelve negativo si el reloj viene desfasado', () => {
    // Un sensor puede reportar un ingreso 5 segundos en el futuro por desfase
    // de reloj. Un "-5 s" en pantalla seria confuso.
    expect(tiempoTranscurrido('2026-09-27T14:35:05', AHORA)).toBe('0 s')
  })
})

describe('cuentaRegresiva (RFA05)', () => {
  it('cuenta hacia abajo con dos digitos', () => {
    expect(cuentaRegresiva('2026-09-27T15:05:00', AHORA)).toBe('30:00')
  })

  it('antepone el signo cuando la reserva ya vencio', () => {
    expect(cuentaRegresiva('2026-09-27T14:30:00', AHORA)).toBe('-05:00')
  })
})

describe('fechas', () => {
  it('formatea fecha y hora en espanol', () => {
    expect(fechaHora('2026-09-27T14:35:00')).toBe('27 sep 2026, 14:35')
    expect(fecha('2026-09-27T14:35:00')).toBe('27 sep 2026')
    expect(hora('2026-09-27T14:35:00')).toBe('14:35')
  })
})

describe('porcentaje', () => {
  it('conserva un decimal y añade el signo', () => {
    expect(porcentaje(38.34)).toBe('38.3 %')
    expect(porcentaje(50)).toBe('50.0 %')
    expect(porcentaje(38.34, 0)).toBe('38 %')
  })
})

describe('nombreRol', () => {
  it('convierte el enum en texto legible', () => {
    // El valor crudo solo debe verse en la URL y en los logs.
    expect(nombreRol('ADMINISTRADOR')).toBe('administrador')
    expect(nombreRol('ADMINISTRADOR_GENERAL')).toBe('administrador general')
  })
})
