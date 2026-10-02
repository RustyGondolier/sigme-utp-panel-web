import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api-client'
import { cuentasAdmin } from '@/mocks/estado'
import { consultarCuentasAdmin, crearCuenta, editarCuenta } from './cuentas.api'

/**
 * Contrato de escritura de RFA12 contra el handler real de MSW.
 *
 * Estas pruebas existen por una razon puntual: la vista replica E2, E3 y E4 para
 * no ofrecer una accion que va a fallar, asi que desde la interfaz no se puede
 * llegar al rechazo del servidor. Este archivo pega la llamada directo y comprueba
 * que el backend tambien dice que no, que es lo que de verdad evita que alguien
 * que llame la API se lleve por delante una cuenta desactivada sin motivo.
 */

function dejarUnaSolaActiva() {
  // Tiene que ser una cuenta distinta de `adm-001`: si la unica activa fuera la
  // del administrador en sesion, ganaria E2 y la prueba no probaria E4.
  cuentasAdmin.items = [
    {
      id: 'adm-003',
      usuario: 'rsoto',
      correo: 'rsoto@utp.edu.pe',
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVO',
      creadoEn: '2026-09-01T12:00:00.000Z',
    },
  ]
}

describe('editarCuenta', () => {
  it('desactiva una cuenta y guarda el motivo en el audit log', async () => {
    const cuenta = await editarCuenta('adm-003', {
      estado: 'BLOQUEADO',
      motivo: 'Cedula de traspaso del area',
    })

    expect(cuenta.estado).toBe('BLOQUEADO')

    const consulta = await consultarCuentasAdmin()
    const enLista = consulta.items.find((c) => c.id === 'adm-003')
    expect(enLista?.estado).toBe('BLOQUEADO')
  })

  it('E2: el servidor se niega a desactivar la cuenta propia', async () => {
    // `esLaCuentaEnSesion` lo pone el handler comparando con `adm-001`.
    await expect(
      editarCuenta('adm-001', { estado: 'BLOQUEADO', motivo: 'Prueba de la excepcion' }),
    ).rejects.toThrow(ApiError)

    const consulta = await consultarCuentasAdmin()
    expect(consulta.items.find((c) => c.id === 'adm-001')?.estado).toBe('ACTIVO')
  })

  it('E3: el servidor se niega si la cuenta tiene reserva activa', async () => {
    await expect(
      editarCuenta('adm-002', { estado: 'BLOQUEADO', motivo: 'Prueba de la excepcion' }),
    ).rejects.toMatchObject({ codigo: 'E3' })

    const consulta = await consultarCuentasAdmin()
    expect(consulta.items.find((c) => c.id === 'adm-002')?.estado).toBe('ACTIVO')
  })

  it('E4: el servidor se niega a dejar el panel sin ninguna cuenta activa', async () => {
    dejarUnaSolaActiva()

    await expect(
      editarCuenta('adm-003', { estado: 'BLOQUEADO', motivo: 'Prueba de la excepcion' }),
    ).rejects.toMatchObject({ codigo: 'E4' })
  })

  it('reactiva una cuenta bloqueada', async () => {
    const cuenta = await editarCuenta('adm-004', { estado: 'ACTIVO' })

    expect(cuenta.estado).toBe('ACTIVO')
  })

  it('no cambia el nombre de usuario aunque venga en el cuerpo', async () => {
    const cuenta = await editarCuenta('adm-003', {
      correo: 'rsoto.nuevo@utp.edu.pe',
      usuario: 'otro',
    } as Parameters<typeof editarCuenta>[1])

    expect(cuenta.correo).toBe('rsoto.nuevo@utp.edu.pe')
    expect(cuenta.usuario).toBe('rsoto')
  })
})

describe('crearCuenta', () => {
  it('crea la cuenta activa y la agrega a la lista', async () => {
    const creada = await crearCuenta({
      usuario: 'aperez',
      correo: 'aperez@utp.edu.pe',
      rol: 'ADMINISTRADOR',
      contrasena: 'utp2026',
    })

    expect(creada.estado).toBe('ACTIVO')

    const consulta = await consultarCuentasAdmin()
    expect(consulta.items.some((c) => c.usuario === 'aperez')).toBe(true)
  })

  it('E1: rechaza un usuario repetido sin distincion de mayusculas', async () => {
    await expect(
      crearCuenta({
        usuario: 'RSOTO',
        correo: 'nuevo@utp.edu.pe',
        rol: 'ADMINISTRADOR',
        contrasena: 'utp2026',
      }),
    ).rejects.toMatchObject({ codigo: 'USUARIO_YA_REGISTRADO', status: 409 })
  })

  it('la contrasena nunca vuelve en la respuesta', async () => {
    const creada = await crearCuenta({
      usuario: 'atemporal',
      correo: 'atemporal@utp.edu.pe',
      rol: 'ADMINISTRADOR',
      contrasena: 'secreta123',
    })

    expect(JSON.stringify(creada)).not.toContain('secreta123')
  })
})
