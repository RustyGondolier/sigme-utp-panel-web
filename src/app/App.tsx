import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { queryClient } from '@/app/queryClient'
import { AppRoutes } from '@/app/routes'
import { AvisosProvider } from '@/components/ui/Avisos'
import { conectarClienteConSesion } from '@/features/auth/session.store'

export function App() {
  // Puente cliente HTTP <-> store de sesion. Va aqui y no en `main.tsx` para
  // que los tests monten `App` y obtengan el mismo comportamiento.
  useEffect(() => {
    conectarClienteConSesion()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Por debajo del router: los avisos sobreviven a los cambios de ruta y
            los usa cualquier vista, incluida la de login. */}
        <AvisosProvider>
          <AppRoutes />
        </AvisosProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
