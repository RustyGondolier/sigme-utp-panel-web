import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Une clases de Tailwind resolviendo conflictos. `twMerge` es lo que permite
 * que un componente acepte `className` y sobrescriba sus propios estilos sin
 * pelearse con el orden del archivo de utilidades.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
