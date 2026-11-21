import { Card } from '@/components/ui'
import { tonoPorOcupacion } from '../dashboard.estilos'
import type { OcupacionPorSotano } from '../types/dashboard.types'
import { BarraProgreso } from './BarraProgreso'

interface Props {
  sotanos: OcupacionPorSotano[]
}

export function OcupacionSotanosCard({ sotanos }: Props) {
  return (
    <Card>
      <div className="p-5">
        <h3 className="text-base font-semibold text-slate-800">Ocupación por sótano</h3>
        <p className="text-xs text-slate-500">Ocupadas y reservadas sobre plazas operativas.</p>

        {sotanos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No hay plazas registradas.</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {sotanos.map((s) => (
              <li key={s.sotano} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">{s.sotano}</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {s.porcentaje.toFixed(1)}%
                  </span>
                </div>
                <BarraProgreso
                  porcentaje={s.porcentaje}
                  tono={tonoPorOcupacion(s.porcentaje)}
                  etiqueta={`Ocupación de ${s.sotano}`}
                />
                <p className="text-xs text-slate-500">
                  {s.ocupadas} ocupadas · {s.reservadas} reservadas · {s.fueraDeServicio} fuera de
                  servicio · {s.totalPlazas} plazas
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
