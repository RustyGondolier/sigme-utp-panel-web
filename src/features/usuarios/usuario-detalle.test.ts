import { describe, expect, it } from 'vitest'
import { iniciales } from './usuario-detalle'

/**
 * Casos limite de `iniciales`, que es lo unico que queda en el archivo.
 *
 * El avatar del encabezado (RFA02) depende de esta funcion y se calcula sobre
 * el nombre tal como lo escribio el usuario: sin espacios de sobra, con
 * nombres compuestos y con nombres de una sola palabra.
 */

describe('iniciales', () => {
  it('toma las dos primeras palabras del nombre completo', () => {
    expect(iniciales('Ana Quispe Huaman')).toBe('AQ')
    expect(iniciales('Maria Gutierrez Salazar')).toBe('MG')
  })

  it('con segundo nombre toma ese segundo nombre, no el apellido', () => {
    // Limitacion conocida y documentada: distinguir un segundo nombre de un
    // apellido paterno exigiria un parser de nombres, y un avatar no lo vale.
    expect(iniciales('Juan Carlos Perez')).toBe('JC')
    expect(iniciales('Jose Luis Ramos Paredes Medina')).toBe('JL')
  })

  it('usa las dos primeras letras si el nombre es una sola palabra', () => {
    expect(iniciales('Ana')).toBe('AN')
  })

  it('normaliza espacios sobrantes', () => {
    expect(iniciales('  Ana   Quispe  ')).toBe('AQ')
    expect(iniciales('Ana\nQuispe')).toBe('AQ')
  })

  it('sube a mayusculas las que vienen en minuscula', () => {
    expect(iniciales('ana quispe')).toBe('AQ')
  })

  it('devuelve cadena vacia si no hay nombre', () => {
    expect(iniciales('')).toBe('')
    expect(iniciales('   ')).toBe('')
  })
})
