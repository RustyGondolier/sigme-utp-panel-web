import { http, HttpResponse } from 'msw'

/**
 * Contrato provisional. Cuando los microservicios esten definidos, este archivo
 * se borra y se apunta VITE_API_BASE_URL al backend real: los componentes ya
 * escriben el codigo definitivo, no hay que refactorizar.
 */
export const handlers = [
  http.get('/api/session', () =>
    HttpResponse.json({
      id: 'adm-001',
      nombre: 'Erick Tellez',
      correo: 'erick.tellez@utp.edu.pe',
      rol: 'ADMINISTRADOR_GENERAL',
    }),
  ),

  http.get('/api/overview', () =>
    HttpResponse.json({
      totalPlazas: 120,
      plazasLibres: 74,
      ocupacionPorcentaje: 38.3,
      reservasActivas: 12,
      sensoresOnline: 8,
      sensoresTotal: 10,
      servidorDisponible: true,
      ultimaActualizacion: new Date().toISOString(),
    }),
  ),
]
