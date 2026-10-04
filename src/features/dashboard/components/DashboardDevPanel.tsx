import { useState } from 'react'
import { ChevronDown, FlaskConical } from 'lucide-react'
import type { Plaza, VehiculoEstacionado } from '@/features/monitor/types/plaza.types'
import type { Sensor } from '@/features/sensores/types/sensor.types'
import type { EventoSimuladoDashboard } from '../types/dashboard.types'

interface Props {
  plazas: Plaza[]
  sensores: Sensor[]
  simularEvento: (evento: EventoSimuladoDashboard) => void
}

/** Plazas que cambian por clic en pico/liberación, para que el salto del % se note. */
const LOTE = 3

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

/** Panel flotante solo para desarrollo: simula eventos del socket sin backend. */
export function DashboardDevPanel({ plazas = [], sensores = [], simularEvento }: Props) {
  const [abierto, setAbierto] = useState(true)
  const [ultimo, setUltimo] = useState<string | null>(null)

  if (!import.meta.env.DEV) return null

  const safePlazas = plazas ?? []
  const safeSensores = sensores ?? []

  const libres = safePlazas.filter((p) => p.estado === 'LIBRE')
  const ocupadas = safePlazas.filter((p) => p.estado === 'OCUPADA')

  function simularPico() {
    const lote = libres.slice(0, LOTE)
    for (const p of lote) {
      simularEvento({
        tipo: 'plaza:estado_cambiado',
        payload: { id: p.id, estado: 'OCUPADA', ocupante: ocupanteSimulado() },
      })
    }
    setUltimo(`Ocupadas: ${lote.map((p) => p.codigo).join(', ')}`)
  }

  function simularLiberacion() {
    const lote = ocupadas.slice(0, LOTE)
    for (const p of lote) {
      simularEvento({
        tipo: 'plaza:estado_cambiado',
        payload: { id: p.id, estado: 'LIBRE' },
      })
    }
    setUltimo(`Liberadas: ${lote.map((p) => p.codigo).join(', ')}`)
  }

  function simularFalloSensor() {
    // Prefiere un sensor activo para que el KPI de sensores cambie.
    const sensor = safeSensores.find((s) => s.estado === 'ACTIVO') ?? safeSensores[0]
    if (sensor === undefined) return
    simularEvento({
      tipo: 'sensor:alerta_sin_senal',
      payload: { id: sensor.id, codigo: sensor.codigo, plazaId: sensor.plazaId },
    })
    setUltimo(`Sin señal: ${sensor.codigo}`)
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-64 rounded-lg border border-dashed border-amber-400 bg-amber-50 text-sm shadow-lg">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-amber-800"
      >
        <FlaskConical className="size-4" aria-hidden="true" />
        Dev: simular dashboard
        <ChevronDown
          className={`ml-auto size-4 transition-transform ${abierto ? '' : '-rotate-90'}`}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div className="space-y-2 border-t border-amber-200 p-3">
          <button
            type="button"
            onClick={simularPico}
            disabled={libres.length === 0}
            className={`${CLASE_BOTON} bg-rose-600 hover:bg-rose-500`}
          >
            Simular Picos de Ocupación
          </button>
          <button
            type="button"
            onClick={simularLiberacion}
            disabled={ocupadas.length === 0}
            className={`${CLASE_BOTON} bg-emerald-600 hover:bg-emerald-500`}
          >
            Simular Liberar Plazas
          </button>
          <button
            type="button"
            onClick={simularFalloSensor}
            disabled={safeSensores.length === 0}
            className={`${CLASE_BOTON} bg-slate-800 hover:bg-slate-700`}
          >
            Fallo de Sensor Crítico
          </button>
          {ultimo && <p className="pt-1 font-mono text-[11px] text-amber-800">Último: {ultimo}</p>}
        </div>
      )}
    </div>
  )
}
