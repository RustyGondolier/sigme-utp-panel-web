import { AUDITORIA_MOCK, CUENTAS_ADMIN_MOCK } from '@/mocks/fixtures'
import type { CuentaAdmin, EntradaAuditoria } from '@/lib/types/dominio'

/**
 * Estado que los handlers de MSW pueden modificar.
 *
 * RFA12 es la primera historia que escribe, y hasta ahora todos los fixtures
 * eran de solo lectura. Eso obliga a separar dos cosas que antes eran la misma:
 *
 * - `fixtures.ts` guarda la semilla, inmutable y compartida. Es la que describe
 *   como se ven los datos.
 * - Este archivo guarda la copia viva, que crear, editar y desactivar modifican.
 *
 * La copia se reinicia en `mocks/setup.ts` antes de cada test. Sin eso, una prueba
 * que desactiva una cuenta se la estaria pasando a la siguiente por el mismo
 * archivo, y el fallo apareceria en un test que no tiene nada que ver. Los datos
 * de la app real viven en el servidor y no tienen este problema, asi que el
 * reset solo existe para las pruebas.
 */

/** Cuentas de administrador vivas. Los handlers la modifican, nunca la reasignan. */
export const cuentasAdmin: { items: CuentaAdmin[] } = { items: [] }

/** Audit log vivo. Cada mutacion de RFA12 agrega una entrada al principio. */
export const auditoria: { items: EntradaAuditoria[] } = { items: [] }

/** Devuelve el estado a la semilla. La llama `setup.ts` en cada `beforeEach`. */
export function reiniciarEstado() {
  cuentasAdmin.items = structuredClone(CUENTAS_ADMIN_MOCK)
  auditoria.items = structuredClone(AUDITORIA_MOCK)
}

/**
 * Agrega una entrada al audit log.
 *
 * Va al principio porque RFA10 lo muestra del mas reciente al mas antiguo, y se
 * numera desde el final para que los ids sembrados (`aud-001`...) no choquen con
 * los que se generan en caliente.
 */
export function registrarAuditoria(entrada: Omit<EntradaAuditoria, 'id' | 'ocurridoEn'>) {
  const siguiente = auditoria.items.length + 1

  auditoria.items.unshift({
    ...entrada,
    id: `aud-${String(siguiente).padStart(3, '0')}`,
    ocurridoEn: new Date().toISOString(),
  })
}

reiniciarEstado()
