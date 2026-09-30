import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import { App } from '@/app/App'
import '@/styles/globals.css'

async function bootstrap() {
  // MSW intercepta fetch/axios en desarrollo. Cuando exista la API real,
  // se desactiva con VITE_ENABLE_MOCK=false sin tocar ningun componente.
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK !== 'false') {
    const { startMockServer } = await import('@/mocks/browser')
    await startMockServer()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
