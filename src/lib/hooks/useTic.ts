import { useEffect, useState } from 'react'

/**
 * Tick de un segundo. RFA05 exige que el temporizador de cada reserva se
 * actualice en tiempo real. Este hook provee la señal de reloj; cada celda
 * calcula su propio texto con `cuentaRegresiva`, para que 30 filas no
 * registren 30 timers.
 */
export function useTic(activo = true, intervaloMs = 1000): Date {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    if (!activo) return
    const t = setInterval(() => setAhora(new Date()), intervaloMs)
    return () => clearInterval(t)
  }, [activo, intervaloMs])

  return ahora
}
