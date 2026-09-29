import { AlertTriangle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

/**
 * Confirmacion destructiva. La usan RFA06 (cancelar reserva), RFA12
 * (desactivar cuenta) y RFA08 (eliminar pregunta de una categoria con
 * preguntas asociadas). En los tres casos el motivo es obligatorio.
 *
 * El componente posee y valida el motivo a proposito. Si cada vista manejara su
 * propio estado, habria que confiar en que cada dev deshabilite el boton
 * correctamente; aqui el requisito se cumple por construccion y el test de
 * este archivo lo cubre una vez para todas las vistas.
 */
export function ConfirmDialog({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  etiquetaConfirmar = 'Confirmar',
  cargando = false,
  /** Campo extra opcional del formulario de confirmacion. */
  children,
}: {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: (motivo: string) => void
  titulo: string
  descripcion?: string
  etiquetaConfirmar?: string
  cargando?: boolean
  children?: ReactNode
}) {
  const [motivo, setMotivo] = useState('')
  const [tocado, setTocado] = useState(false)

  // Al reabrir el dialogo el motivo empieza limpio: no se arrastra el de la
  // confirmacion anterior. Se ajusta durante el render y no en un effect, que
  // provocaria un render extra solo para limpiar el formulario.
  const [abiertoAnterior, setAbiertoAnterior] = useState(abierto)
  if (abierto !== abiertoAnterior) {
    setAbiertoAnterior(abierto)
    if (abierto) {
      setMotivo('')
      setTocado(false)
    }
  }

  const motivoValido = motivo.trim().length >= 10

  return (
    <Modal
      abierto={abierto}
      onCerrar={cargando ? () => {} : onCerrar}
      titulo={titulo}
      descripcion={descripcion}
      ancho="sm"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            variante="peligro"
            onClick={() => onConfirmar(motivo.trim())}
            disabled={!motivoValido}
            cargando={cargando}
          >
            {etiquetaConfirmar}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-4">
          {children}
          <Field
            etiqueta="Motivo (obligatorio)"
            htmlFor="motivo-confirmacion"
            error={
              tocado && !motivoValido ? 'Describe el motivo en al menos 10 caracteres.' : undefined
            }
            ayuda="Queda registrado en el audit log con tu nombre y la fecha UTC."
          >
            <Textarea
              id="motivo-confirmacion"
              rows={3}
              value={motivo}
              autoFocus
              onChange={(e) => setMotivo(e.target.value)}
              onBlur={() => setTocado(true)}
              placeholder="Ej. Ingreso duplicado detectado por el sensor de la plaza."
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
