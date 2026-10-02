import { useEffect, useState } from 'react'
import type { CategoriaFaq, PreguntaFaq } from '@/lib/types/dominio'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAvisos } from '@/components/ui/avisos-context'
import { crearCategoria, obtenerFaq } from './faq.api'

export function FaqPage() {
  const [categorias, setCategorias] = useState<CategoriaFaq[]>([])
  const [preguntas, setPreguntas] = useState<PreguntaFaq[]>([])
  const [cargando, setCargando] = useState(true)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)
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

      <div className="space-y-4">
        {categorias
          .sort((a, b) => a.orden - b.orden)
          .map((categoria) => (
            <section key={categoria.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">{categoria.nombre}</h2>

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
    </div>
  )
}
