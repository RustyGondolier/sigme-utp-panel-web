import { useEffect, useState } from 'react'
import type { CategoriaFaq, PreguntaFaq } from '@/lib/types/dominio'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { useAvisos } from '@/components/ui/avisos-context'
import {
  actualizarCategoria,
  crearCategoria,
  crearPregunta,
  eliminarCategoria,
  obtenerFaq,
} from './faq.api'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
  const { avisar } = useAvisos()

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

              <div className="mt-3 space-y-3">
                {preguntas
                  .filter((pregunta) => pregunta.categoriaId === categoria.id)
                  .sort((a, b) => a.orden - b.orden)
                  .map((pregunta) => (
                    <div key={pregunta.id} className="rounded-md border border-slate-100 p-3">
                      <p className="font-medium text-slate-900">{pregunta.pregunta}</p>
                      <p className="mt-1 text-sm text-slate-600">{pregunta.respuesta}</p>
                    </div>
                  ))}
              </div>
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
    </div>
  )
}
