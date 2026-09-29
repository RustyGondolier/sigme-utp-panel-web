import { z } from 'zod'
import { get, post } from '@/lib/api-client'
import type { Sesion } from '@/lib/types/dominio'

/**
 * Login del administrador (RFA09) y limite de intentos (RNF07).
 *
 * El contador de intentos y el bloqueo de 5 minutos los mantiene el servidor,
 * no el formulario: por eso `intentosRestantes` y `bloqueadoHasta` llegan en la
 * respuesta de error y no se calculan aqui. Reproducir esa logica en el front
 * daria una falsa sensacion de seguridad y permitira saltarsela desde la
 * consola del navegador.
 */

export const credencialesSchema = z.object({
  usuario: z.string().trim().min(1, 'Ingresa tu usuario'),
  contrasena: z.string().min(1, 'Ingresa tu contrasena'),
})

export type Credenciales = z.infer<typeof credencialesSchema>

/** Cuerpo del error de credenciales. RNF07 exige que no diga que campo fallo. */
export interface DetalleIntentos {
  intentosRestantes: number
  bloqueadoHasta?: string
}

export async function iniciarSesion(credenciales: Credenciales): Promise<Sesion> {
  return post<Sesion>('/auth/login', credenciales)
}

export function sesionActual(): Promise<Sesion> {
  return get<Sesion>('/auth/sesion')
}
