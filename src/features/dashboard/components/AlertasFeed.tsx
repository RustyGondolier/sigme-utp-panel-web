import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui'
import type { AlertaDashboard, ModuloAlerta, NivelAlerta } from '../types/dashboard.types'

interface Props {
  alertas: AlertaDashboard[]
  onDescartar: (id: string) => void
}

const NIVELES: NivelAlerta[] = ['CRITICO', 'ADVERTENCIA', 'INFO']

const CONFIG_NIVEL: Record<
  NivelAlerta,
  { plural: string; Icono: LucideIcon; borde: string; icono: string }
> = {
  CRITICO: {
    plural: 'Críticas',
    Icono: CircleAlert,
    borde: 'border-l-rose-500',
    icono: 'text-rose-600',
  },
  ADVERTENCIA: {
    plural: 'Advertencias',
    Icono: TriangleAlert,
    borde: 'border-l-amber-500',
    icono: 'text-amber-600',
  },
  INFO: {
    plural: 'Info',
    Icono: Info,
    borde: 'border-l-sky-500',
    icono: 'text-sky-600',
  },
}

const NOMBRE_MODULO: Record<ModuloAlerta, string> = {
  MONITOR: 'Monitor',
  SENSORES: 'Sensores',
  RESERVAS: 'Reservas',
}

function tiempoRelativo(iso: string, ahora: number): string {
  const minutos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60_000))
  if (minutos < 1) return 'justo ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}

export function AlertasFeed({ alertas, onDescartar }: Props) {
  const [filtro, setFiltro] = useState<NivelAlerta | 'TODAS'>('TODAS')

  // Refresca los "hace X min" sin necesidad de recargar.
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const visibles = filtro === 'TODAS' ? alertas : alertas.filter((a) => a.nivel === filtro)
  const contar = (nivel: NivelAlerta) => alertas.filter((a) => a.nivel === nivel).length

  const pildora = (activa: boolean) =>
    `rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
      activa
        ? 'bg-slate-800 text-white ring-slate-800'
        : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
    }`

  return (
    <Card>
      <div className="p-5">
        <h3 className="text-base font-semibold text-slate-800">Alertas recientes</h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={filtro === 'TODAS'}
            onClick={() => setFiltro('TODAS')}
            className={pildora(filtro === 'TODAS')}
          >
            Todas ({alertas.length})
          </button>
          {NIVELES.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={filtro === n}
              onClick={() => setFiltro(n)}
              className={pildora(filtro === n)}
            >
              {CONFIG_NIVEL[n].plural} ({contar(n)})
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto">
          {visibles.length === 0 ? (
            <EmptyState
              titulo={
                alertas.length === 0 ? 'Sin alertas pendientes' : 'No hay alertas con ese filtro'
              }
              descripcion={
                alertas.length === 0
                  ? 'Todo está en orden por ahora.'
                  : 'Cambia el nivel para ver más alertas.'
              }
              icono={<CircleCheck className="size-8" aria-hidden="true" />}
            />
          ) : (
            <ul className="space-y-2">
              {visibles.map((a) => {
                const { Icono, borde, icono } = CONFIG_NIVEL[a.nivel]
                return (
                  <li
                    key={a.id}
                    className={`flex items-start gap-3 rounded-lg border border-l-4 border-slate-200 bg-white p-3 ${borde}`}
                  >
                    <Icono className={`mt-0.5 size-5 shrink-0 ${icono}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium text-slate-800">{a.titulo}</p>
                      <p className="text-slate-600">{a.mensaje}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {NOMBRE_MODULO[a.modulo]} · {tiempoRelativo(a.timestamp, ahora)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDescartar(a.id)}
                      aria-label={`Descartar alerta: ${a.titulo}`}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}
