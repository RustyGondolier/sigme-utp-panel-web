import { CLASES_TONO, type TonoKPI } from '../dashboard.estilos'

interface Props {
  porcentaje: number
  tono: TonoKPI
  /** Texto para lectores de pantalla, ej: "Ocupación general". */
  etiqueta: string
}

export function BarraProgreso({ porcentaje, tono, etiqueta }: Props) {
  const valor = Math.min(100, Math.max(0, porcentaje))
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(valor)}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ease-in-out ${CLASES_TONO[tono].barra}`}
        style={{ width: `${valor}%` }}
      />
    </div>
  )
}
