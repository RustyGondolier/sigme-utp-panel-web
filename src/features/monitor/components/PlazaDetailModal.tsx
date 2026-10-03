import { useEffect, useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { minutosDesde } from '../hooks/usePlazas'
import { CONFIG_ESTADO_PLAZA, formatearDuracion, formatearFechaHora } from '../plazas.etiquetas'
import type { Plaza } from '../types/plaza.types'

interface Props {
  plaza: Plaza
  onClose: () => void
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-slate-500">{etiqueta}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  )
}

export function PlazaDetailModal({ plaza, onClose }: Props) {
  const { etiqueta, insignia } = CONFIG_ESTADO_PLAZA[plaza.estado]

  // El tiempo transcurrido se refresca mientras el modal está abierto.
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const { ocupante } = plaza
  const esReserva = plaza.estado === 'RESERVADA'

  return (
    <Dialog.Root
      open
      onOpenChange={(abierto) => {
        if (!abierto) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-xl font-semibold text-slate-800">
                Plaza {plaza.codigo}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                {plaza.sotano} · {plaza.zona}
              </Dialog.Description>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${insignia}`}
            >
              {etiqueta}
            </span>
          </div>

          {ocupante ? (
            <dl className="mt-5 divide-y divide-slate-100 text-sm">
              <Fila etiqueta={esReserva ? 'Reservada por' : 'Usuario'}>{ocupante.usuario}</Fila>
              <Fila etiqueta="Placa">
                <span className="font-mono">{ocupante.placa}</span>
              </Fila>
              <Fila etiqueta={esReserva ? 'Reservada desde' : 'Hora de ingreso'}>
                {formatearFechaHora(ocupante.horaIngreso)}
              </Fila>
              <Fila etiqueta="Tiempo transcurrido">
                {formatearDuracion(minutosDesde(ocupante.horaIngreso, ahora))}
              </Fila>
            </dl>
          ) : plaza.estado === 'FUERA_DE_SERVICIO' ? (
            <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Esta plaza está fuera de servicio: no puede ocuparse ni reservarse hasta que se
              habilite.
            </p>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {plaza.estado === 'LIBRE'
                ? 'Esta plaza está libre y disponible.'
                : 'No hay datos del ocupante para esta plaza.'}
            </p>
          )}

          <dl className="mt-3 border-t border-slate-100 text-sm">
            <Fila etiqueta="Sensor">
              {plaza.sensorCodigo ? (
                <span className="font-mono">{plaza.sensorCodigo}</span>
              ) : (
                <span className="font-normal text-slate-400">Sin sensor asignado</span>
              )}
            </Fila>
          </dl>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
