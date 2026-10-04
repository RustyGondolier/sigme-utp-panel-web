import type { PreguntaFaq } from '@/lib/types/dominio'

export function calcularNuevoOrdenFaq(
  preguntas: PreguntaFaq[],
  activeId: string,
  overId: string,
): string[] | null {
  const preguntaActiva = preguntas.find((pregunta) => pregunta.id === activeId)
  const preguntaDestino = preguntas.find((pregunta) => pregunta.id === overId)

  if (!preguntaActiva || !preguntaDestino) return null

  if (preguntaActiva.categoriaId !== preguntaDestino.categoriaId) {
    return null
  }

  const preguntasCategoria = preguntas
    .filter((pregunta) => pregunta.categoriaId === preguntaActiva.categoriaId)
    .sort((a, b) => a.orden - b.orden)

  const indiceOrigen = preguntasCategoria.findIndex((pregunta) => pregunta.id === activeId)

  const indiceDestino = preguntasCategoria.findIndex((pregunta) => pregunta.id === overId)

  if (indiceOrigen === -1 || indiceDestino === -1) return null

  const nuevoOrden = [...preguntasCategoria]
  const [movida] = nuevoOrden.splice(indiceOrigen, 1)

  nuevoOrden.splice(indiceDestino, 0, movida)

  return nuevoOrden.map((pregunta) => pregunta.id)
}
