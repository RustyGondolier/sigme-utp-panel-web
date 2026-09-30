import { describe, expect, it } from 'vitest'
import { expirada } from '@/features/auth/session.store'
import { mensajeConexion, useConexion } from '@/lib/conexion'
import type { Sesion } from '@/lib/types/dominio'

const sesionCon = (expiraEn: string): Sesion => ({
  token: 't',
  adminId: 'adm-001',
  nombre: 'Administrador',
  usuario: 'admin',
  correo: 'admin@utp.edu.pe',
  rol: 'ADMINISTRADOR',
  expiraEn,
})

describe('expirada (RNF05)', () => {
  it('no-expira una sesion con token vigente', () => {
    const futura = new Date(Date.now() + 60_000).toISOString()
    expect(expirada(sesionCon(futura))).toBe(false)
  })

  it('expira cuando paso la hora de validez', () => {
    const pasada = new Date(Date.now() - 60_000).toISOString()
    expect(expirada(sesionCon(pasada))).toBe(true)
  })

  it('trata la ausencia de sesion como sesion expirada', () => {
    // Asi el guard no necesita un caso aparte para "no hay sesion".
    expect(expirada(null)).toBe(true)
  })
})

describe('aviso de conexion (RNF06)', () => {
  it('no muestra nada cuando la API responde', () => {
    expect(mensajeConexion(true, Date.now())).toBeNull()
  })

  it('avisa sin_connection cuando la API no responde', () => {
    expect(mensajeConexion(false)).toBe('Sin conexion con el servidor. Reintentando...')
  })

  it('indica cuanto lleva caida la conexion', () => {
    const hace5min = Date.now() - 5 * 60_000
    expect(mensajeConexion(false, hace5min)).toContain('hace 5 min')
  })

  it('recupera el estado conectado y limpia el ultimo fallo', () => {
    useConexion.getState().marcarFallo()
    expect(useConexion.getState().conectado).toBe(false)

    useConexion.getState().marcarConectado()
    expect(useConexion.getState().conectado).toBe(true)
    expect(mensajeConexion(true, Date.now())).toBeNull()
  })
})
