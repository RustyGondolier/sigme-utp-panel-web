import { del, get, patch, post } from '@/lib/api-client'
import type { CategoriaFaq, PreguntaFaq } from '@/lib/types/dominio'

export interface FaqData {
  categorias: CategoriaFaq[]
  preguntas: PreguntaFaq[]
}

export function obtenerFaq(): Promise<FaqData> {
  return get<FaqData>('/faq')
}

export function crearCategoria(nombre: string): Promise<CategoriaFaq> {
  return post<CategoriaFaq>('/faq/categorias', { nombre })
}

export function actualizarCategoria(id: string, nombre: string): Promise<CategoriaFaq> {
  return patch<CategoriaFaq>(`/faq/categorias/${id}`, { nombre })
}

export function eliminarCategoria(id: string, motivo: string): Promise<void> {
  return del<void>(`/faq/categorias/${id}?motivo=${encodeURIComponent(motivo)}`)
}

export function crearPregunta(datos: {
  categoriaId: string
  pregunta: string
  respuesta: string
}): Promise<PreguntaFaq> {
  return post<PreguntaFaq>('/faq/preguntas', datos)
}

export function actualizarPregunta(
  id: string,
  datos: {
    categoriaId: string
    pregunta: string
    respuesta: string
  },
): Promise<PreguntaFaq> {
  return patch<PreguntaFaq>(`/faq/preguntas/${id}`, datos)
}

export function eliminarPregunta(id: string, motivo: string): Promise<void> {
  return del<void>(`/faq/preguntas/${id}?motivo=${encodeURIComponent(motivo)}`)
}

export function reordenarPreguntas(ids: string[]): Promise<void> {
  return patch<void>('/faq/preguntas/orden', { ids })
}
