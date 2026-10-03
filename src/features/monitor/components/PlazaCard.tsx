import { useEffect, useRef, useState } from 'react'
import { CONFIG_ESTADO_PLAZA } from '../plazas.etiquetas'
import type { Plaza } from '../types/plaza.types'

interface Props {
  plaza: Plaza
  onSeleccionar: (plaza: Plaza) => void
}

export function PlazaCard({ plaza, onSeleccionar }: Props) {
  const { etiqueta, tarjeta, Icono } = CONFIG_ESTADO_PLAZA[plaza.estado]

  // Resalta la tarjeta ~1.5 s cuando el estado cambia (no en el primer render).
  const [resaltada, setResaltada] = useState(false)
  const estadoPrevio = useRef(plaza.estado)
  useEffect(() => {
    if (estadoPrevio.current === plaza.estado) return
    estadoPrevio.current = plaza.estado
    setResaltada(true)
    const id = setTimeout(() => setResaltada(false), 1500)
    return () => clearTimeout(id)
  }, [plaza.estado])

  return (
    <button
      type="button"
      onClick={() => onSeleccionar(plaza)}
      aria-label={`Plaza ${plaza.codigo}, ${etiqueta.toLowerCase()}. Ver detalle`}
      className={`flex min-h-28 flex-col rounded-xl border p-4 text-left transition-all duration-500 ease-in-out hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none motion-reduce:transition-none ${tarjeta} ${resaltada ? 'scale-105 ring-2 ring-sky-400 ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl font-bold">{plaza.codigo}</span>
        <Icono className="size-5 shrink-0" aria-hidden="true" />
      </div>
      <span className="text-xs font-medium">{etiqueta}</span>

      <div className="mt-auto pt-3 text-xs">
        {plaza.ocupante ? (
          <>
            <span className="block font-mono font-medium">{plaza.ocupante.placa}</span>
            <span className="block truncate opacity-80">{plaza.ocupante.usuario}</span>
          </>
        ) : (
          <span className="block opacity-70">
            {plaza.sotano} · {plaza.zona}
          </span>
        )}
      </div>
    </button>
  )
}
