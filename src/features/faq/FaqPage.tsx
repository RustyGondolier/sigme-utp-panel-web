import { useEffect, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CategoriaFaq, PreguntaFaq } from '@/lib/types/dominio'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { useAvisos } from '@/components/ui/avisos-context'
import {
  actualizarCategoria,
  actualizarPregunta,
  crearCategoria,
  crearPregunta,
  eliminarCategoria,
  eliminarPregunta,
  obtenerFaq,
  reordenarPreguntas,
} from './faq.api'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { ReactNode } from 'react'
import { calcularNuevoOrdenFaq } from './faq.reorder'

interface PreguntaSortableProps {
  id: string
  children: ReactNode
}

function PreguntaSortable({ id, children }: PreguntaSortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastrar pregunta"
          className="cursor-grab rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
        >
          Arrastrar
        </button>
      </div>

      {children}
    </div>
  )
}

export function FaqPage() {
  const [categorias, setCategorias] = useState<CategoriaFaq[]>([])
  const [preguntas, setPreguntas] = useState<PreguntaFaq[]>([])
  const [cargando, setCargando] = useState(true)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null)
  const [nombreCategoriaEditando, setNombreCategoriaEditando] = useState('')
  const [guardandoCategoria, setGuardandoCategoria] = useState(false)
  const [categoriaEliminando, setCategoriaEliminando] = useState<CategoriaFaq | null>(null)
  const [eliminandoCategoria, setEliminandoCategoria] = useState(false)
  const [categoriaPreguntaNueva, setCategoriaPreguntaNueva] = useState('')
  const [textoPreguntaNueva, setTextoPreguntaNueva] = useState('')
  const [respuestaPreguntaNueva, setRespuestaPreguntaNueva] = useState('')
  const [creandoPregunta, setCreandoPregunta] = useState(false)
  const [preguntaEditandoId, setPreguntaEditandoId] = useState<string | null>(null)
  const [categoriaPreguntaEditando, setCategoriaPreguntaEditando] = useState('')
  const [textoPreguntaEditando, setTextoPreguntaEditando] = useState('')
  const [respuestaPreguntaEditando, setRespuestaPreguntaEditando] = useState('')
  const [guardandoPregunta, setGuardandoPregunta] = useState(false)
  const [preguntaEliminando, setPreguntaEliminando] = useState<PreguntaFaq | null>(null)
  const [eliminandoPregunta, setEliminandoPregunta] = useState(false)
  const [, setReordenandoPregunta] = useState(false)
  const { avisar } = useAvisos()
  async function manejarFinArrastre(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const idsNuevoOrden = calcularNuevoOrdenFaq(preguntas, String(active.id), String(over.id))

    if (!idsNuevoOrden) return

    setReordenandoPregunta(true)

    try {
      await reordenarPreguntas(idsNuevoOrden)

      setPreguntas((actuales) =>
        actuales.map((pregunta) => {
          const posicion = idsNuevoOrden.findIndex((id) => id === pregunta.id)

          return posicion >= 0 ? { ...pregunta, orden: posicion + 1 } : pregunta
        }),
      )
    } finally {
      setReordenandoPregunta(false)
    }
  }

  useEffect(() => {
    obtenerFaq()
      .then((respuesta) => {
        setCategorias(respuesta.categorias)
        setPreguntas(respuesta.preguntas)
      })
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return <p className="text-sm text-slate-500">Cargando preguntas frecuentes...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Preguntas frecuentes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administra el contenido de ayuda que se muestra en la aplicacion movil.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row">
        <Input
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
          placeholder="Nombre de la nueva categoria"
          aria-label="Nombre de la nueva categoria"
        />

        <Button
          onClick={async () => {
            if (!nuevaCategoria.trim()) return

            setCreandoCategoria(true)

            try {
              const categoria = await crearCategoria(nuevaCategoria)

              setCategorias((actuales) => [...actuales, categoria])
              setNuevaCategoria('')
              avisar('exito', 'Categoria creada correctamente.')
            } catch (error) {
              avisar(
                'error',
                error instanceof Error ? error.message : 'No se pudo crear la categoria.',
              )
            } finally {
              setCreandoCategoria(false)
            }
          }}
          disabled={!nuevaCategoria.trim()}
          cargando={creandoCategoria}
        >
          Nueva categoria
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Nueva pregunta</h2>

        <Select
          value={categoriaPreguntaNueva}
          onChange={(e) => setCategoriaPreguntaNueva(e.target.value)}
          aria-label="Categoria de la nueva pregunta"
        >
          <option value="">Selecciona una categoria</option>
          {categorias
            .sort((a, b) => a.orden - b.orden)
            .map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
        </Select>

        <Input
          value={textoPreguntaNueva}
          onChange={(e) => setTextoPreguntaNueva(e.target.value)}
          placeholder="Pregunta"
          aria-label="Nueva pregunta"
        />

        <Textarea
          value={respuestaPreguntaNueva}
          onChange={(e) => setRespuestaPreguntaNueva(e.target.value)}
          placeholder="Respuesta"
          aria-label="Respuesta de la nueva pregunta"
          rows={3}
        />

        <Button
          onClick={async () => {
            if (
              !categoriaPreguntaNueva ||
              !textoPreguntaNueva.trim() ||
              !respuestaPreguntaNueva.trim()
            ) {
              return
            }

            setCreandoPregunta(true)

            try {
              const nueva = await crearPregunta({
                categoriaId: categoriaPreguntaNueva,
                pregunta: textoPreguntaNueva,
                respuesta: respuestaPreguntaNueva,
              })

              setPreguntas((actuales) => [...actuales, nueva])
              setCategoriaPreguntaNueva('')
              setTextoPreguntaNueva('')
              setRespuestaPreguntaNueva('')
              avisar('exito', 'Pregunta creada correctamente.')
            } catch (error) {
              avisar(
                'error',
                error instanceof Error ? error.message : 'No se pudo crear la pregunta.',
              )
            } finally {
              setCreandoPregunta(false)
            }
          }}
          disabled={
            !categoriaPreguntaNueva || !textoPreguntaNueva.trim() || !respuestaPreguntaNueva.trim()
          }
          cargando={creandoPregunta}
        >
          Crear pregunta
        </Button>
      </div>

      <div className="space-y-4">
        {categorias
          .sort((a, b) => a.orden - b.orden)
          .map((categoria) => (
            <section key={categoria.id} className="rounded-lg border border-slate-200 bg-white p-4">
              {categoriaEditandoId === categoria.id ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={nombreCategoriaEditando}
                    onChange={(e) => setNombreCategoriaEditando(e.target.value)}
                    aria-label="Editar nombre de categoria"
                  />

                  <Button
                    onClick={async () => {
                      if (!nombreCategoriaEditando.trim()) return

                      setGuardandoCategoria(true)

                      try {
                        const actualizada = await actualizarCategoria(
                          categoria.id,
                          nombreCategoriaEditando,
                        )

                        setCategorias((actuales) =>
                          actuales.map((item) => (item.id === actualizada.id ? actualizada : item)),
                        )

                        setCategoriaEditandoId(null)
                        setNombreCategoriaEditando('')
                        avisar('exito', 'Categoria actualizada correctamente.')
                      } catch (error) {
                        avisar(
                          'error',
                          error instanceof Error
                            ? error.message
                            : 'No se pudo actualizar la categoria.',
                        )
                      } finally {
                        setGuardandoCategoria(false)
                      }
                    }}
                    cargando={guardandoCategoria}
                    disabled={!nombreCategoriaEditando.trim()}
                  >
                    Guardar
                  </Button>

                  <Button
                    variante="secundario"
                    onClick={() => {
                      setCategoriaEditandoId(null)
                      setNombreCategoriaEditando('')
                    }}
                    disabled={guardandoCategoria}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">{categoria.nombre}</h2>

                  <div className="flex gap-2">
                    <Button
                      variante="secundario"
                      onClick={() => {
                        setCategoriaEditandoId(categoria.id)
                        setNombreCategoriaEditando(categoria.nombre)
                      }}
                    >
                      Editar
                    </Button>

                    <Button variante="peligro" onClick={() => setCategoriaEliminando(categoria)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}

              <DndContext collisionDetection={closestCenter} onDragEnd={manejarFinArrastre}>
                <SortableContext
                  items={preguntas
                    .filter((pregunta) => pregunta.categoriaId === categoria.id)
                    .sort((a, b) => a.orden - b.orden)
                    .map((pregunta) => pregunta.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-3 space-y-3">
                    {preguntas
                      .filter((pregunta) => pregunta.categoriaId === categoria.id)
                      .sort((a, b) => a.orden - b.orden)
                      .map((pregunta) => (
                        <PreguntaSortable key={pregunta.id} id={pregunta.id}>
                          <div className="rounded-md border border-slate-100 p-3">
                            {preguntaEditandoId === pregunta.id ? (
                              <div className="space-y-3">
                                <Select
                                  value={categoriaPreguntaEditando}
                                  onChange={(e) => setCategoriaPreguntaEditando(e.target.value)}
                                  aria-label="Categoria de la pregunta"
                                >
                                  {categorias
                                    .sort((a, b) => a.orden - b.orden)
                                    .map((categoria) => (
                                      <option key={categoria.id} value={categoria.id}>
                                        {categoria.nombre}
                                      </option>
                                    ))}
                                </Select>

                                <Input
                                  value={textoPreguntaEditando}
                                  onChange={(e) => setTextoPreguntaEditando(e.target.value)}
                                  aria-label="Editar pregunta"
                                />

                                <Textarea
                                  value={respuestaPreguntaEditando}
                                  onChange={(e) => setRespuestaPreguntaEditando(e.target.value)}
                                  aria-label="Editar respuesta"
                                  rows={3}
                                />

                                <div className="flex gap-2">
                                  <Button
                                    onClick={async () => {
                                      if (
                                        !categoriaPreguntaEditando ||
                                        !textoPreguntaEditando.trim() ||
                                        !respuestaPreguntaEditando.trim()
                                      ) {
                                        return
                                      }

                                      setGuardandoPregunta(true)

                                      try {
                                        const actualizada = await actualizarPregunta(pregunta.id, {
                                          categoriaId: categoriaPreguntaEditando,
                                          pregunta: textoPreguntaEditando,
                                          respuesta: respuestaPreguntaEditando,
                                        })

                                        setPreguntas((actuales) =>
                                          actuales.map((item) =>
                                            item.id === actualizada.id ? actualizada : item,
                                          ),
                                        )

                                        setPreguntaEditandoId(null)
                                        avisar('exito', 'Pregunta actualizada correctamente.')
                                      } catch (error) {
                                        avisar(
                                          'error',
                                          error instanceof Error
                                            ? error.message
                                            : 'No se pudo actualizar la pregunta.',
                                        )
                                      } finally {
                                        setGuardandoPregunta(false)
                                      }
                                    }}
                                    cargando={guardandoPregunta}
                                  >
                                    Guardar
                                  </Button>

                                  <Button
                                    variante="secundario"
                                    onClick={() => setPreguntaEditandoId(null)}
                                    disabled={guardandoPregunta}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {pregunta.pregunta}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                      {pregunta.respuesta}
                                    </p>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variante="secundario"
                                      onClick={() => {
                                        setPreguntaEditandoId(pregunta.id)
                                        setCategoriaPreguntaEditando(pregunta.categoriaId)
                                        setTextoPreguntaEditando(pregunta.pregunta)
                                        setRespuestaPreguntaEditando(pregunta.respuesta)
                                      }}
                                    >
                                      Editar
                                    </Button>

                                    <Button
                                      variante="peligro"
                                      onClick={() => setPreguntaEliminando(pregunta)}
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </PreguntaSortable>
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          ))}
      </div>

      <ConfirmDialog
        abierto={Boolean(categoriaEliminando)}
        onCerrar={() => setCategoriaEliminando(null)}
        onConfirmar={async (motivo) => {
          if (!categoriaEliminando) return

          setEliminandoCategoria(true)

          try {
            await eliminarCategoria(categoriaEliminando.id, motivo)

            setCategorias((actuales) =>
              actuales.filter((categoria) => categoria.id !== categoriaEliminando.id),
            )

            setPreguntas((actuales) =>
              actuales.filter((pregunta) => pregunta.categoriaId !== categoriaEliminando.id),
            )

            avisar('exito', 'Categoria eliminada correctamente.')
            setCategoriaEliminando(null)
          } catch (error) {
            avisar(
              'error',
              error instanceof Error ? error.message : 'No se pudo eliminar la categoria.',
            )
          } finally {
            setEliminandoCategoria(false)
          }
        }}
        titulo="Eliminar categoria"
        descripcion={
          categoriaEliminando
            ? `Se eliminaran tambien ${
                preguntas.filter((pregunta) => pregunta.categoriaId === categoriaEliminando.id)
                  .length
              } preguntas asociadas.`
            : undefined
        }
        etiquetaConfirmar="Eliminar categoria"
        cargando={eliminandoCategoria}
      />

      <ConfirmDialog
        abierto={Boolean(preguntaEliminando)}
        onCerrar={() => setPreguntaEliminando(null)}
        onConfirmar={async (motivo) => {
          if (!preguntaEliminando) return

          setEliminandoPregunta(true)

          try {
            await eliminarPregunta(preguntaEliminando.id, motivo)

            setPreguntas((actuales) =>
              actuales.filter((pregunta) => pregunta.id !== preguntaEliminando.id),
            )

            avisar('exito', 'Pregunta eliminada correctamente.')
            setPreguntaEliminando(null)
          } catch (error) {
            avisar(
              'error',
              error instanceof Error ? error.message : 'No se pudo eliminar la pregunta.',
            )
          } finally {
            setEliminandoPregunta(false)
          }
        }}
        titulo="Eliminar pregunta"
        descripcion="Esta accion eliminara la pregunta seleccionada."
        etiquetaConfirmar="Eliminar pregunta"
        cargando={eliminandoPregunta}
      />
    </div>
  )
}
