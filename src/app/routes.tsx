import { Navigate, Route, Routes } from 'react-router'
import { PlaceholderPage } from '@/app/PlaceholderPage'
import { ProtectedLayout } from '@/app/layouts/ProtectedLayout'
import { RequireAuth, RequireRole } from '@/app/guards/RequireAuth'
import LoginPage from '@/features/auth/LoginPage'
import AccesoDenegadoPage from '@/features/auth/AccesoDenegadoPage'
import { UsuariosPage } from '@/features/usuarios/UsuariosPage'

/**
 * Estructura de rutas segun RFA13.
 *
 * IMPORTANTE para trabajo en equipo: los PATHS de este archivo se CONGELAN al
 * terminar el Sprint 0. Cada desarrollador solo anade sus rutas dentro de
 * src/features/<dominio>/routes.tsx y las registra aqui una unica vez, al
 * empezar su historia. Nadie reorganiza el orden ni cambia paths existentes.
 *
 * Las secciones del menu lateral salen de `app/navItems.tsx`, que es la unica
 * fuente de verdad; ese archivo es el que crece cuando hay una vista nueva.
 *
 * COMO SE PROTEGE: todo lo que cuelga de `RequireAuth` exige sesion vigente, y
 * `ProtectedLayout` aporta el menu lateral y el titulo de pagina. En el MVP hay
 * un solo rol (RFA09), asi que `RequireRole` no oculta nada todavia, pero ya
 * esta en el arbol: agregar el rol ADMINISTRADOR_GENERAL en el Sprint 2 es
 * envolver la ruta, no reescribirla.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Publica */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protegidas: sesion + layout comun */}
      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<PlaceholderPage rfa="RFA11" titulo="Dashboard" />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route
            path="/usuarios/:id"
            element={<PlaceholderPage rfa="RFA02" titulo="Detalle de usuario" />}
          />
          <Route
            path="/monitor"
            element={<PlaceholderPage rfa="RFA03" titulo="Monitoreo del estacionamiento" />}
          />
          <Route
            path="/reservas"
            element={<PlaceholderPage rfa="RFA05" titulo="Reservas activas" />}
          />
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

          {/* RFA13 caso E1: seccion restringida por rol. */}
          <Route element={<RequireRole roles={['ADMINISTRADOR']} />}>
            <Route
              path="/configuracion/administradores"
              element={<PlaceholderPage rfa="RFA12" titulo="Cuentas de administrador" />}
            />
            <Route
              path="/configuracion/auditoria"
              element={<PlaceholderPage rfa="RFA10" titulo="Audit log" />}
            />
          </Route>

          <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
