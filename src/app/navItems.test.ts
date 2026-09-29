import { describe, expect, it } from 'vitest'
import { ITEMS_MENU, itemPorPath, itemsVisibles } from '@/app/navItems'

/**
 * Congela la estructura de navegacion que exige RFA13 criterio 2. Si alguien
 * agrega, quita, reordena o renombra una seccion, este test falla y el cambio
 * tiene que ser una decision consciente, no un descuido.
 */
describe('navItems (RFA13)', () => {
  it('expone exactamente las nueve secciones del requerimiento, en orden', () => {
    expect(ITEMS_MENU.map((i) => i.etiqueta)).toEqual([
      'Dashboard',
      'Usuarios',
      'Monitor',
      'Reservas',
      'Sensores',
      'Historial de accesos',
      'Preguntas frecuentes',
      'Administradores',
      'Audit log',
    ])
  })

  it('respeta los paths que ya estan congelados en routes.tsx', () => {
    expect(ITEMS_MENU.map((i) => i.path)).toEqual([
      '/',
      '/usuarios',
      '/monitor',
      '/reservas',
      '/sensores',
      '/accesos',
      '/contenido/faq',
      '/configuracion/administradores',
      '/configuracion/auditoria',
    ])
  })

  it('agrupa en Operacion, Contenido y Configuracion en ese orden', () => {
    const grupos = ITEMS_MENU.map((i) => i.grupo)
    expect(grupos).toEqual([
      'principal',
      'principal',
      'principal',
      'principal',
      'principal',
      'principal',
      'contenido',
      'configuracion',
      'configuracion',
    ])
  })

  it('no repite paths y todos apuntan a una seccion con icono y descripcion', () => {
    const paths = ITEMS_MENU.map((i) => i.path)
    expect(new Set(paths).size).toBe(paths.length)

    for (const item of ITEMS_MENU) {
      expect(item.Icono, `${item.path} sin icono`).toBeTruthy()
      expect(item.descripcion, `${item.path} sin descripcion`).not.toBe('')
      expect(item.rfa, `${item.path} sin codigo de requerimiento`).toMatch(/^RFA\d+$/)
    }
  })

  it('todo item declara al menos un rol', () => {
    // Hoy solo existe ADMINISTRADOR, pero el filtro por rol ya debe ser real:
    // es lo que hara que agregar el segundo rol no requiera reescribir el menu.
    for (const item of ITEMS_MENU) {
      expect(item.roles.length, `${item.path} sin roles`).toBeGreaterThan(0)
    }
  })
})

describe('itemsVisibles', () => {
  it('muestra las nueve secciones al unico rol del MVP', () => {
    expect(itemsVisibles('ADMINISTRADOR')).toHaveLength(9)
  })
})

describe('itemPorPath', () => {
  it('resuelve el path exacto', () => {
    expect(itemPorPath('/monitor', 'ADMINISTRADOR')?.rfa).toBe('RFA03')
  })

  it('resuelve una ruta hija al item de su seccion', () => {
    // /usuarios/123 debe marcar "Usuarios" activo, no ninguna otra seccion.
    expect(itemPorPath('/usuarios/123', 'ADMINISTRADOR')?.rfa).toBe('RFA01')
  })

  it('no confunde el raiz con las demas rutas', () => {
    expect(itemPorPath('/', 'ADMINISTRADOR')?.rfa).toBe('RFA11')
  })

  it('devuelve undefined si la ruta no pertenece a ninguna seccion', () => {
    expect(itemPorPath('/ruta-inexistente', 'ADMINISTRADOR')).toBeUndefined()
  })
})
