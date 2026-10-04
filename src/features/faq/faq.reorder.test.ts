import { describe, expect, it } from 'vitest'
import { calcularNuevoOrdenFaq } from './faq.reorder'

describe('calcularNuevoOrdenFaq', () => {
  const preguntas = [
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
  ]

  it('mueve una pregunta a una nueva posicion dentro de la misma categoria', () => {
    expect(calcularNuevoOrdenFaq(preguntas, 'faq-01', 'faq-02')).toEqual(['faq-02', 'faq-01'])
  })

  it('no permite mover preguntas entre categorias diferentes', () => {
    const preguntasConOtraCategoria = [
      ...preguntas,
      {
        id: 'faq-03',
        categoriaId: 'cat-02',
        pregunta: 'Otra pregunta',
        respuesta: 'Otra respuesta',
        orden: 1,
      },
    ]

    expect(calcularNuevoOrdenFaq(preguntasConOtraCategoria, 'faq-01', 'faq-03')).toBeNull()
  })
})
