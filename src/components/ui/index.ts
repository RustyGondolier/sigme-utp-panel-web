/**
 * Barrel de los primitivos del design system.
 *
 * Regla: los componentes de `components/ui` son agnosticos de dominio. Si uno
 * necesita saber que es una "plaza", una "reserva" o un "sensor", no pertenece
 * aqui: va en `components/shared`, que es donde viven las piezas reusables con
 * semantica de SIGME-UTP.
 */
export { Button, type ButtonProps, type ButtonVariants } from './Button'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card'
export { Badge, StatusDot, type BadgeProps } from './Badge'
export { DataTable, Paginacion, type Columna, type PaginacionEstado } from './DataTable'
export { EmptyState, ErrorState, Skeleton, SkeletonTabla } from './Estados'
export { AvisosProvider } from './Avisos'
export { useAvisos, type Aviso, type Tono } from './avisos-context'
export { ConfirmDialog } from './ConfirmDialog'
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'
export { Field, Input, Select, Textarea, type InputProps } from './Input'
export { Modal } from './Modal'
export { FilterBar, SearchInput } from './SearchInput'
export { Tabs, type PanelTab } from './Tabs'
export { Tooltip, TooltipProvider } from './Tooltip'
