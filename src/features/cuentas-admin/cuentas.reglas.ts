import type { CuentaAdmin, Rol } from '@/lib/types/dominio'

/**
 * Reglas de RFA12 que el administrador siente antes de que el servidor responda.
 *
 * EL SERVIDOR ES LA AUTORIDAD (regla 8). Estas reglas existen para no ofrecer un
 * boton que va a fallar: si el administrador pulsa "Desactivar" sobre su propia
 * cuenta, llena el motivo y recien ahi le dicen que no puede, la pantalla parece
 * rota. La misma comprobacion vive en `mocks/handlers.ts` y es la que manda; al
 * cambiar una, se cambian las dos, y cada excepcion esta anclada a su codigo
 * (E2, E3, E4) para que no se pierdan al divergir.
 *
 * Van en un `.ts` al lado de la vista (regla 4) y sin JSX porque ademas se
 * prueban solas, sin levantar React ni MSW.
 */

/** Por que no se puede desactivar. `null` significa que si se puede. */
export type BloqueoDesactivacion = 'E2' | 'E3' | 'E4'

/**
 * Que reglas bloquean desactivar `cuenta` y por que se escoge esa.
 *
 * El orden importa y es el de los casos de la especificacion: la cuenta propia
 * (E2) es una regla sobre "esta" cuenta, la reserva (E3) tambien, y la ultima
 * cuenta activa (E4) es sobre el conjunto. Si el administrador se desactiva a si
 * mismo y ademas es el ultimo activo, el motivo que se le muestra es el primero:
 * es el que puede entender y corregir.
 *
 * No recibe el id del administrador en sesion sino el flag `esLaCuentaEnSesion`
 * que pone el servidor, porque el servidor es quien sabe quien esta autenticado:
 * asi la vista no tiene que leer el store de `auth` y las dos features siguen
 * sin importarse.
 */
export function bloqueoDesactivacion(
  cuenta: CuentaAdmin,
  cuentas: CuentaAdmin[],
): BloqueoDesactivacion | null {
  if (cuenta.esLaCuentaEnSesion) return 'E2'
  if (cuenta.reservaActiva) return 'E3'

  const activos = cuentas.filter((c) => c.estado === 'ACTIVO').length
  return activos <= 1 ? 'E4' : null
}

/**
 * Lo que se le dice al administrador, en sus palabras.
 *
 * Vive aca y no en la vista porque el mensaje es parte de la regla: es lo que
 * evita que el administrador piense que la aplicacion esta rota.
 */
export const MOTIVO_BLOQUEO: Record<BloqueoDesactivacion, string> = {
  E2: 'No puedes desactivar la cuenta con la que iniciaste sesion.',
  E3: 'La cuenta tiene una reserva de plaza activa.',
  E4: 'No puedes desactivar la ultima cuenta de administrador activa.',
}

/** Acciones disponibles sobre una cuenta. */
export type AccionCuenta = 'EDITAR' | 'DESACTIVAR' | 'REACTIVAR'

/**
 * Que acciones existen segun el estado de la cuenta.
 *
 * Aqui va solo lo que depende del ESTADO; lo que impide actuar en este momento
 * (E2, E3, E4) lo dice `bloqueoDesactivacion`. La separacion es a proposito: que
 * "Desactivar" aparezca siempre en una cuenta activa, deshabilitado y con la
 * razon al lado, enseña la regla; si el boton desapareciera en silencio, el
 * administrador solo veria que no hay accion y no sabria por que.
 *
 * Editar solo tiene sentido en una cuenta activa (paso 5 habla de cambiar el
 * correo mientras la cuenta esta en uso) y reactivar es lo unico que se puede
 * hacer con una bloqueada.
 */
export function accionesDe(cuenta: CuentaAdmin): AccionCuenta[] {
  return cuenta.estado === 'BLOQUEADO' ? ['REACTIVAR'] : ['EDITAR', 'DESACTIVAR']
}

/** Campos del formulario de alta, tal como los captura el modal (paso 3). */
export interface FormularioCuenta {
  usuario: string
  correo: string
  rol: Rol
  contrasena: string
}

/** Un campo con su error, para pintarlo junto al input. */
export type ErroresFormulario = Partial<Record<keyof FormularioCuenta, string>>

/**
 * Acepta cualquier subdominio institucional (`@utp.edu.pe`, `@alumnos.utp.edu.pe`)
 * y rechaza lo demas: un correo personal o un dominio truncado no son una forma
 * de identificar a un administrador de la universidad.
 */
const CORREO_INSTITUCIONAL = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*utp\.edu\.pe$/

/**
 * El correo institucional se valida aparte porque aparece en dos formularios: el
 * alta y la edicion. Compartir la misma regla evita que uno pida `@utp.edu.pe` y
 * el otro acepte cualquier cosa.
 */
export function validarCorreo(correo: string): string | undefined {
  return CORREO_INSTITUCIONAL.test(correo.trim())
    ? undefined
    : 'Usa el correo institucional, por ejemplo nombre@utp.edu.pe.'
}

/**
 * Valida el alta antes de enviarla (E1 lo ve el servidor, que es quien tiene el
 * registro; aca solo se evitan los errores de teclear).
 *
 * De la contrasena solo se exige que no venga vacia. RFA12 no fija una politica
 * de contraseñas y el panel no es quien la aplica: inventar un minimo de
 * caracteres aca daria una regla que el servidor no comparte, y el
 * administrador veria un rechazo sin explicacion. La contrasena la genera el
 * sistema y llega por un canal que no es este formulario.
 */
export function validarCuenta(formulario: FormularioCuenta): ErroresFormulario {
  const errores: ErroresFormulario = {}

  if (formulario.usuario.trim() === '') {
    errores.usuario = 'Ingresa el nombre de usuario.'
  }

  const correo = validarCorreo(formulario.correo)
  if (correo) errores.correo = correo

  if (formulario.contrasena.trim() === '') {
    errores.contrasena = 'Ingresa la contrasena temporal.'
  }

  return errores
}
