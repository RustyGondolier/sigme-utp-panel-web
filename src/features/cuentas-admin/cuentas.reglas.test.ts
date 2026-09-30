import { describe, expect, it } from 'vitest'
import type { CuentaAdmin } from '@/lib/types/dominio'
import {
  MOTIVO_BLOQUEO,
  accionesDe,
  bloqueoDesactivacion,
  validarCorreo,
  validarCuenta,
} from './cuentas.reglas'

/**
 * Reglas de RFA12 probadas sin React ni MSW.
 *
 * Cada excepcion de la especificacion tiene su caso, incluido E4: con el
 * fixture sembrado hay tres cuentas activas, asi que para llegar a "la ultima
 * activa" hay que construir el caso a mano. Es exactamente el hueco que la
 * interfaz no puede cubrir (en la lista real la cuenta propia siempre esta
 * activa y E2 se adelanta a E4), asi que el test es la unica red de seguridad de
 * esa regla.
 */

function cuenta(extra: Partial<CuentaAdmin> = {}): CuentaAdmin {
  return {
    id: 'adm-900',
    usuario: 'nuevo',
    correo: 'nuevo@utp.edu.pe',
    rol: 'ADMINISTRADOR',
    estado: 'ACTIVO',
    creadoEn: '2026-09-01T12:00:00.000Z',
    ...extra,
  }
}

describe('bloqueoDesactivacion (E2, E3, E4)', () => {
  it('no bloquea una cuenta corriente cuando hay varias activas', () => {
    const lista = [cuenta(), cuenta({ id: 'adm-901' }), cuenta({ id: 'adm-902' })]

    expect(bloqueoDesactivacion(lista[0], lista)).toBeNull()
  })

  it('E2: bloquea la cuenta con la que se inicia sesion', () => {
    const propia = cuenta({ esLaCuentaEnSesion: true })
    const lista = [propia, cuenta({ id: 'adm-901' })]

    expect(bloqueoDesactivacion(propia, lista)).toBe('E2')
  })

  it('E3: bloquea una cuenta con reserva de plaza activa', () => {
    const conReserva = cuenta({ reservaActiva: true })
    const lista = [conReserva, cuenta({ id: 'adm-901' })]

    expect(bloqueoDesactivacion(conReserva, lista)).toBe('E3')
  })

  it('E4: bloquea la desactivacion cuando es la unica cuenta activa', () => {
    const unica = cuenta()
    const bloqueadas = [
      unica,
      cuenta({ id: 'adm-901', estado: 'BLOQUEADO' }),
      cuenta({ id: 'adm-902', estado: 'BLOQUEADO' }),
    ]

    expect(bloqueoDesactivacion(unica, bloqueadas)).toBe('E4')
  })

  it('el orden de las excepciones manda cuando coinciden varias', () => {
    // Ultima activa, con reserva y propia a la vez: se muestra E2 porque es la
    // unica que el administrador puede corregir sin esperar.
    const propia = cuenta({ esLaCuentaEnSesion: true, reservaActiva: true })
    const lista = [propia, cuenta({ id: 'adm-901', estado: 'BLOQUEADO' })]

    expect(bloqueoDesactivacion(propia, lista)).toBe('E2')
  })

  it('cada excepcion tiene su mensaje en el idioma del administrador', () => {
    expect(MOTIVO_BLOQUEO.E2).not.toBe(MOTIVO_BLOQUEO.E3)
    expect(MOTIVO_BLOQUEO.E3).not.toBe(MOTIVO_BLOQUEO.E4)
  })
})

describe('accionesDe', () => {
  it('una cuenta activa se edita y se desactiva, aunque este bloqueada', () => {
    // El boton sale deshabilitado con el motivo al lado, no escondido: asi el
    // administrador aprende la regla en vez de pensar que le faltan permisos.
    expect(accionesDe(cuenta({ esLaCuentaEnSesion: true }))).toEqual(['EDITAR', 'DESACTIVAR'])
    expect(accionesDe(cuenta({ reservaActiva: true }))).toEqual(['EDITAR', 'DESACTIVAR'])
  })

  it('una cuenta bloqueada solo se reactiva', () => {
    expect(accionesDe(cuenta({ estado: 'BLOQUEADO' }))).toEqual(['REACTIVAR'])
  })
})

describe('validarCuenta', () => {
  it('acepta un alta completa y bien formada', () => {
    expect(
      validarCuenta({
        usuario: 'mgomez',
        correo: 'mgomez@utp.edu.pe',
        rol: 'ADMINISTRADOR',
        contrasena: 'utp2026',
      }),
    ).toEqual({})
  })

  it('exige nombre de usuario', () => {
    const errores = validarCuenta({
      usuario: '  ',
      correo: 'mgomez@utp.edu.pe',
      rol: 'ADMINISTRADOR',
      contrasena: 'utp2026',
    })

    expect(errores.usuario).toBeTruthy()
  })

  it('exige correo institucional: uno personal no pasa', () => {
    const errores = validarCuenta({
      usuario: 'mgomez',
      correo: 'mgomez@gmail.com',
      rol: 'ADMINISTRADOR',
      contrasena: 'utp2026',
    })

    expect(errores.correo).toBeTruthy()
  })

  it('exige una contrasena temporal', () => {
    const errores = validarCuenta({
      usuario: 'mgomez',
      correo: 'mgomez@utp.edu.pe',
      rol: 'ADMINISTRADOR',
      contrasena: '   ',
    })

    expect(errores.contrasena).toBeTruthy()
  })
})

describe('validarCorreo', () => {
  it('el mismo criterio sirve en el alta y en la edicion', () => {
    expect(validarCorreo('rsoto@utp.edu.pe')).toBeUndefined()
    expect(validarCorreo('rsoto@alumnos.utp.edu.pe')).toBeUndefined()
    expect(validarCorreo('rsoto@utp.edu')).toBeTruthy()
    expect(validarCorreo('')).toBeTruthy()
  })
})
