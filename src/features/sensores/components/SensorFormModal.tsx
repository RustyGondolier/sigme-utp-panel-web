import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { CrearSensorDTO, Sensor } from '@/features/sensores/types/sensor.types'

/**
 * Formulario de sensor para crear y editar (RFA04).
 *
 * Se monta solo cuando esta abierto y el padre le pasa un `key` distinto por
 * sensor, asi el estado inicial sale de las props sin efectos de sincronizacion.
 * Sin `sensor` = modo creacion.
 */

interface Props {
  sensor?: Sensor
  onSubmit: (datos: CrearSensorDTO) => void
  onClose: () => void
}

interface Valores {
  codigo: string
  plazaId: string
  ubicacion: string
  bateria: string
  observaciones: string
}

type Errores = Partial<Record<keyof Valores, string>>

const CLASE_INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 aria-[invalid=true]:border-red-500'

function validar(v: Valores): Errores {
  const errores: Errores = {}
  if (v.codigo.trim() === '') errores.codigo = 'El código es obligatorio.'
  if (v.plazaId.trim() === '') errores.plazaId = 'La plaza es obligatoria.'
  if (v.ubicacion.trim() === '') errores.ubicacion = 'La ubicación es obligatoria.'
  if (v.bateria.trim() !== '') {
    const n = Number(v.bateria)
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      errores.bateria = 'Ingresa un entero entre 0 y 100.'
    }
  }
  return errores
}

function Campo(props: {
  id: string
  etiqueta: string
  requerido?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="text-sm font-medium text-slate-700">
        {props.etiqueta}
        {props.requerido && <span className="text-red-600"> *</span>}
      </label>
      {props.children}
      {props.error && (
        <p id={`${props.id}-error`} role="alert" className="text-xs text-red-600">
          {props.error}
        </p>
      )}
    </div>
  )
}

export function SensorFormModal({ sensor, onSubmit, onClose }: Props) {
  const esEdicion = sensor !== undefined

  const [valores, setValores] = useState<Valores>({
    codigo: sensor?.codigo ?? '',
    plazaId: sensor?.plazaId ?? '',
    ubicacion: sensor?.ubicacion ?? '',
    bateria: sensor?.bateria?.toString() ?? '',
    observaciones: sensor?.observaciones ?? '',
  })
  const [errores, setErrores] = useState<Errores>({})

  function cambiar(campo: keyof Valores, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  function enviar() {
    const encontrados = validar(valores)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    onSubmit({
      codigo: valores.codigo.trim(),
      plazaId: valores.plazaId.trim(),
      ubicacion: valores.ubicacion.trim(),
      bateria: valores.bateria.trim() === '' ? undefined : Number(valores.bateria),
      observaciones: valores.observaciones.trim() === '' ? undefined : valores.observaciones.trim(),
    })
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(abierto) => {
        if (!abierto) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-slate-800">
            {esEdicion ? `Editar sensor ${sensor.codigo}` : 'Nuevo sensor'}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500">
            Los campos con * son obligatorios.
          </Dialog.Description>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              enviar()
            }}
            className="mt-5 space-y-4"
          >
            <Campo id="sensor-codigo" etiqueta="Código" requerido error={errores.codigo}>
              <input
                id="sensor-codigo"
                value={valores.codigo}
                onChange={(e) => cambiar('codigo', e.target.value)}
                aria-invalid={errores.codigo ? true : undefined}
                aria-describedby={errores.codigo ? 'sensor-codigo-error' : undefined}
                className={CLASE_INPUT}
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="sensor-plaza" etiqueta="Plaza" requerido error={errores.plazaId}>
                <input
                  id="sensor-plaza"
                  value={valores.plazaId}
                  onChange={(e) => cambiar('plazaId', e.target.value)}
                  aria-invalid={errores.plazaId ? true : undefined}
                  aria-describedby={errores.plazaId ? 'sensor-plaza-error' : undefined}
                  className={CLASE_INPUT}
                />
              </Campo>
              <Campo id="sensor-bateria" etiqueta="Batería (%)" error={errores.bateria}>
                <input
                  id="sensor-bateria"
                  type="number"
                  min={0}
                  max={100}
                  value={valores.bateria}
                  onChange={(e) => cambiar('bateria', e.target.value)}
                  aria-invalid={errores.bateria ? true : undefined}
                  aria-describedby={errores.bateria ? 'sensor-bateria-error' : undefined}
                  className={CLASE_INPUT}
                />
              </Campo>
            </div>

            <Campo id="sensor-ubicacion" etiqueta="Ubicación" requerido error={errores.ubicacion}>
              <input
                id="sensor-ubicacion"
                value={valores.ubicacion}
                onChange={(e) => cambiar('ubicacion', e.target.value)}
                aria-invalid={errores.ubicacion ? true : undefined}
                aria-describedby={errores.ubicacion ? 'sensor-ubicacion-error' : undefined}
                className={CLASE_INPUT}
              />
            </Campo>

            <Campo id="sensor-observaciones" etiqueta="Observaciones">
              <textarea
                id="sensor-observaciones"
                rows={3}
                value={valores.observaciones}
                onChange={(e) => cambiar('observaciones', e.target.value)}
                className={CLASE_INPUT}
              />
            </Campo>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                {esEdicion ? 'Guardar cambios' : 'Crear sensor'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
