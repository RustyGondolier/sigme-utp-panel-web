import { Navigate, Route, Routes } from 'react-router'
import { PlaceholderPage } from '@/app/PlaceholderPage'

/**
 * Estructura de rutas segun RFA13.
 *
 * IMPORTANTE para trabajo en equipo: este archivo se CONGELA al terminar el
 * Sprint 0. Cada desarrollador solo anade sus rutas dentro de
 * src/features/<dominio>/routes.tsx y las registra aqui una unica vez, al
 * empezar su historia. Nadie reorganiza el orden ni cambia paths existentes.
 *
 * Secciones del menu lateral (RFA13, criterio 2):
 *   Dashboard, Usuarios, Monitor, Reservas, Sensores, Historial de accesos,
 *   Contenido > FAQ, Configuracion > Administradores, Configuracion > Audit log.
 *
 * Las dos ultimas solo son visibles para el rol ADMINISTRADOR_GENERAL.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Publica */}
      <Route path="/login" element={<PlaceholderPage rfa="RFA09" titulo="Iniciar sesion" />} />

      {/* Protegidas */}
      <Route path="/" element={<PlaceholderPage rfa="RFA11" titulo="Dashboard" />} />
      <Route
        path="/usuarios"
        element={<PlaceholderPage rfa="RFA01" titulo="Consulta de usuarios" />}
      />
      <Route
        path="/usuarios/:id"
        element={<PlaceholderPage rfa="RFA02" titulo="Detalle de usuario" />}
      />
      <Route
        path="/monitor"
        element={<PlaceholderPage rfa="RFA03" titulo="Monitoreo del estacionamiento" />}
      />
      <Route path="/reservas" element={<PlaceholderPage rfa="RFA05" titulo="Reservas activas" />} />
      <Route
        path="/sensores"
        element={<PlaceholderPage rfa="RFA04" titulo="Gestion de sensores" />}
      />
      <Route
        path="/accesos"
        element={<PlaceholderPage rfa="RFA07" titulo="Historial de accesos" />}
      />
      <Route
        path="/contenido/faq"
        element={<PlaceholderPage rfa="RFA08" titulo="Preguntas frecuentes" />}
      />
      <Route
        path="/configuracion/administradores"
        element={<PlaceholderPage rfa="RFA12" titulo="Cuentas de administrador" />}
      />
      <Route
        path="/configuracion/auditoria"
        element={<PlaceholderPage rfa="RFA10" titulo="Audit log" />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
