import { useState } from 'react'
import { ChevronDown, FlaskConical } from 'lucide-react'
import type { EventoPlazaCambiada, Plaza, VehiculoEstacionado } from '../types/plaza.types'

interface Props {
  plazas: Plaza[]
  simularEvento: (evento: EventoPlazaCambiada) => void
}

function ocupanteSimulado(): VehiculoEstacionado {
  const numero = Math.floor(Math.random() * 900) + 100
  return {
    placa: `SIM-${numero}`,
    usuario: 'Usuario Simulado',
    horaIngreso: new Date().toISOString(),
  }
}

const CLASE_BOTON =
  'w-full rounded-md px-3 py-1.5 text-left text-xs font-medium text-white disabled:opacity-50'

/** Panel flotante solo para desarrollo: simula `plaza:estado_cambiado` sin backend. */
export function MonitorDevPanel({ plazas, simularEvento }: Props) {
  const [abierto, setAbierto] = useState(true)
  const [ultimo, setUltimo] = useState<string | null>(null)

  if (!import.meta.env.DEV) return null

  function emitir(plaza: Plaza | undefined, evento: Omit<EventoPlazaCambiada, 'id'>) {
    if (plaza === undefined) return
    simularEvento({ id: plaza.id, ...evento })
    setUltimo(`${plaza.codigo} → ${evento.estado}`)
  }

  const porCodigo = (codigo: string) => plazas.find((p) => p.codigo === codigo)

  function alternarAleatoria() {
    if (plazas.length === 0) return
    const plaza = plazas[Math.floor(Math.random() * plazas.length)]
    if (plaza.estado === 'LIBRE') {
      emitir(plaza, { estado: 'OCUPADA', ocupante: ocupanteSimulado() })
    } else {
      emitir(plaza, { estado: 'LIBRE' })
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-30 w-64 rounded-lg border border-dashed border-amber-400 bg-amber-50 text-sm shadow-lg">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-amber-800"
      >
        <FlaskConical className="size-4" aria-hidden="true" />
        Dev: simular plazas
        <ChevronDown
          className={`ml-auto size-4 transition-transform ${abierto ? '' : '-rotate-90'}`}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div className="space-y-2 border-t border-amber-200 p-3">
          <button
            type="button"
            onClick={() =>
              emitir(porCodigo('A-01'), { estado: 'OCUPADA', ocupante: ocupanteSimulado() })
            }
            disabled={porCodigo('A-01') === undefined}
            className={`${CLASE_BOTON} bg-rose-600 hover:bg-rose-500`}
          >
            Simular Ocupar A-01
          </button>
          <button
            type="button"
            onClick={() => emitir(porCodigo('A-01'), { estado: 'LIBRE' })}
            disabled={porCodigo('A-01') === undefined}
            className={`${CLASE_BOTON} bg-emerald-600 hover:bg-emerald-500`}
          >
            Simular Liberar A-01
          </button>
          <button
            type="button"
            onClick={() => emitir(porCodigo('B-05'), { estado: 'FUERA_DE_SERVICIO' })}
            disabled={porCodigo('B-05') === undefined}
            className={`${CLASE_BOTON} bg-slate-600 hover:bg-slate-500`}
          >
            Simular Fuera de Servicio (B-05)
          </button>
          <button
            type="button"
            onClick={alternarAleatoria}
            disabled={plazas.length === 0}
            className={`${CLASE_BOTON} bg-slate-800 hover:bg-slate-700`}
          >
            Alternar Plaza Aleatoria
          </button>
          {ultimo && <p className="pt-1 font-mono text-[11px] text-amber-800">Último: {ultimo}</p>}
        </div>
      )}
    </div>
  )
}
