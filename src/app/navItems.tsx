import {
  BookOpen,
  ClipboardList,
  Gauge,
  History,
  LayoutDashboard,
  Radio,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Rol } from '@/lib/types/dominio'

/**
 * Configuracion del menu lateral. Es la UNICA fuente de verdad de la
 * navegacion: el sidebar, los guards de rol, los accesos rapidos del
 * dashboard y el PageHeader leen de aqui.
 *
 * RFA13 criterio 2 exige exactamente estas secciones, en este orden:
 *   Dashboard, Usuarios, Monitor, Reservas, Sensores, Historial de accesos,
 *   Contenido > FAQ, Configuracion > Administradores, Configuracion > Audit log.
 *
 * El campo `roles` implementa el criterio 3 (secciones restringidas). En el
 * MVP hay un solo rol (RFA09), asi que hoy ningun item queda oculto, pero la
 * comprobacion ya esta en el codigo y en sus tests: agregar un rol despues es
 * agregarlo al union `Rol` y ponerlo en el `roles` del item.
 */

export type GrupoMenu = 'principal' | 'contenido' | 'configuracion'

export interface ItemMenu {
  /** Debe coincidir con el path registrado en app/routes.tsx. */
  path: string
  etiqueta: string
  descripcion: string
  Icono: LucideIcon
  grupo: GrupoMenu
  roles: Rol[]
  /** Codigo del requerimiento, que el PageHeader muestra junto al titulo. */
  rfa: string
}

export const ITEMS_MENU: ItemMenu[] = [
  {
    path: '/',
    etiqueta: 'Dashboard',
    descripcion: 'Resumen del estado operativo del estacionamiento',
    Icono: LayoutDashboard,
    grupo: 'principal',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA11',
  },
  {
    path: '/usuarios',
    etiqueta: 'Usuarios',
    descripcion: 'Consulta de usuarios registrados',
    Icono: Users,
    grupo: 'principal',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA01',
  },
  {
    path: '/monitor',
    etiqueta: 'Monitor',
    descripcion: 'Monitoreo del estacionamiento en tiempo real',
    Icono: Gauge,
    grupo: 'principal',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA03',
  },
  {
    path: '/reservas',
    etiqueta: 'Reservas',
    descripcion: 'Reservas activas y temporizador de 30 minutos',
    Icono: ClipboardList,
    grupo: 'principal',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA05',
  },
  {
    path: '/sensores',
    etiqueta: 'Sensores',
    descripcion: 'Gestion de sensores asociados a plazas',
    Icono: Radio,
    grupo: 'principal',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA04',
  },
  {
    path: '/accesos',
    etiqueta: 'Historial de accesos',
    descripcion: 'Ingresos y salidas del estacionamiento',
    Icono: History,
    grupo: 'principal',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA07',
  },
  {
    path: '/contenido/faq',
    etiqueta: 'Preguntas frecuentes',
    descripcion: 'Contenido de ayuda que ve la app movil',
    Icono: BookOpen,
    grupo: 'contenido',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA08',
  },
  {
    path: '/configuracion/administradores',
    etiqueta: 'Administradores',
    descripcion: 'Cuentas de administrador del panel',
    Icono: Settings,
    grupo: 'configuracion',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA12',
  },
  {
    path: '/configuracion/auditoria',
    etiqueta: 'Audit log',
    descripcion: 'Registro de acciones administrativas (solo lectura)',
    Icono: ScrollText,
    grupo: 'configuracion',
    roles: ['ADMINISTRADOR'],
    rfa: 'RFA10',
  },
]

/** Items que un rol puede ver. RFA13 criterio 3. */
export function itemsVisibles(rol: Rol): ItemMenu[] {
  return ITEMS_MENU.filter((item) => item.roles.includes(rol))
}

/**
 * Busca el item que corresponde a un path. `/usuarios/123` devuelve el de
 * `/usuarios`, para que el sidebar marque activo el detalle de un usuario sin
 * conocer las rutas hijas.
 */
export function itemPorPath(pathname: string, rol: Rol): ItemMenu | undefined {
  const candidatos = itemsVisibles(rol).filter(
    (item) => pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path)),
  )
  return candidatos.sort((a, b) => b.path.length - a.path.length)[0]
}

export const ETIQUETA_GRUPO: Record<GrupoMenu, string> = {
  principal: 'Operacion',
  contenido: 'Contenido',
  configuracion: 'Configuracion',
}

/** Accesos directos del dashboard (RFA11, paso 6). */
export const ACCESOS_RAPIDOS = [
  '/monitor',
  '/reservas',
  '/sensores',
  '/usuarios',
  '/accesos',
] as const

/** Marca del panel en el sidebar. */
export const MARCA = {
  sigla: 'SIGME',
  institucion: 'UTP',
  sistema: 'Gestion de estacionamientos',
} as const
