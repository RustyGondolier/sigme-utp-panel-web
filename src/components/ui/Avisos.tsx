import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AvisosContext, type Aviso, type Tono } from '@/components/ui/avisos-context'

/**
 * Avisos emergentes. Se necesitan en casi toda vista con escritura (RFA04,
 * RFA06, RFA08, RFA12) y RNF10 pide que los errores queden registrados y
 * visibles. Un solo provider en la raiz, montado en `app/App.tsx`, cubre todos
 * los casos.
 *
 * El contenedor usa `aria-live="polite"`: el aviso se anuncia sin interrumpir lo
 * que el administrador esta haciendo. Con `assertive` un error de guardado
 * cortaria lo que esta escribiendo.
 */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const cerrar = useCallback((id: number) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const avisar = useCallback(
    (tono: Tono, texto: string) => {
      const id = Date.now() + Math.random()
      setAvisos((prev) => [...prev, { id, tono, texto }])
      setTimeout(() => cerrar(id), 5000)
    },
    [cerrar],
  )

  const valor = useMemo(() => ({ avisar, cerrar }), [avisar, cerrar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-60 flex w-full max-w-sm flex-col gap-2"
      >
        {avisos.map((a) => (
          <div
            key={a.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm shadow-lg',
              a.tono === 'exito' && 'border-accent-200 bg-accent-50 text-accent-900',
              a.tono === 'error' && 'border-brand-200 bg-brand-50 text-brand-900',
              a.tono === 'info' && 'bg-surface border-slate-200 text-slate-800',
            )}
          >
            {a.tono === 'exito' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : a.tono === 'error' ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1">{a.texto}</span>
            <button
              type="button"
              onClick={() => cerrar(a.id)}
              aria-label="Cerrar aviso"
              className="-mt-0.5 -mr-1 rounded p-1 opacity-60 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}
