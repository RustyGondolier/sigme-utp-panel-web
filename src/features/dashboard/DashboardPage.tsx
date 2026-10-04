import { CalendarClock, Car, Gauge, RadioTower } from 'lucide-react'
import { CONFIG_ESTADO_PLAZA } from '@/features/monitor/plazas.etiquetas'
import { AlertasFeed } from './components/AlertasFeed'
import { BarraProgreso } from './components/BarraProgreso'
import { KPICard } from './components/KPICard'
import { OcupacionSotanosCard } from './components/OcupacionSotanosCard'
import { tonoPorOcupacion, type TonoKPI } from './dashboard.estilos'
import { useDashboard } from './hooks/useDashboard'

/**
 * Dashboard (RFA11).
 *
 * Etapa 2: tarjetas KPI, ocupacion por sotano y feed de alertas sobre los
 * datos derivados de `useDashboard`.
 */

const ETIQUETA_OCUPACION: Record<TonoKPI, string> = {
  exito: 'Normal',
  alerta: 'Alta',
  critico: 'Crítica',
  neutro: '',
}

export function DashboardPage() {
  const { isLoading, kpis, resumenSensores, ocupacionSotanos, alertas, descartarAlerta } =
    useDashboard()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  const operativas = kpis.totalPlazas - kpis.fueraDeServicio
  const tonoOcupacion = tonoPorOcupacion(kpis.porcentajeOcupacion)

  const conteoPlazas = {
    LIBRE: kpis.libres,
    OCUPADA: kpis.ocupadas,
    RESERVADA: kpis.reservadas,
  } as const
  const tonoPlazas: TonoKPI = kpis.libres === 0 ? 'critico' : kpis.libres <= 2 ? 'alerta' : 'exito'
  const indicadorPlazas =
    kpis.libres === 0 ? 'Sin cupos' : kpis.libres <= 2 ? 'Pocos cupos' : 'Disponibles'

  const s = resumenSensores
  const tonoSensores: TonoKPI =
    s.sinSeñal > 0 ? 'critico' : s.alertasBateriaBaja > 0 ? 'alerta' : 'exito'
  const indicadorSensores =
    s.sinSeñal > 0
      ? `${s.sinSeñal} sin señal`
      : s.alertasBateriaBaja > 0
        ? `${s.alertasBateriaBaja} batería baja`
        : 'Operativos'
  const porcentajeSensores = s.total === 0 ? 0 : (s.activos / s.total) * 100

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Dashboard (RFA11)</h2>
        <p className="text-sm text-slate-500">
          Resumen del estacionamiento: ocupación, sensores, reservas y alertas recientes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          icono={Gauge}
          titulo="Ocupación general"
          valor={`${kpis.porcentajeOcupacion.toFixed(1)}%`}
          subtitulo={`${kpis.ocupadas + kpis.reservadas} de ${operativas} plazas operativas`}
          indicador={ETIQUETA_OCUPACION[tonoOcupacion]}
          tono={tonoOcupacion}
        >
          <BarraProgreso
            porcentaje={kpis.porcentajeOcupacion}
            tono={tonoOcupacion}
            etiqueta="Ocupación general"
          />
        </KPICard>

        <KPICard
          icono={Car}
          titulo="Plazas libres"
          valor={kpis.libres}
          subtitulo={`de ${kpis.totalPlazas} plazas en total`}
          indicador={indicadorPlazas}
          tono={tonoPlazas}
        >
          <div className="flex flex-wrap gap-1.5 text-xs font-medium">
            {(['LIBRE', 'OCUPADA', 'RESERVADA'] as const).map((e) => (
              <span
                key={e}
                className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${CONFIG_ESTADO_PLAZA[e].insignia}`}
              >
                {CONFIG_ESTADO_PLAZA[e].plural}: {conteoPlazas[e]}
              </span>
            ))}
          </div>
        </KPICard>

        <KPICard
          icono={RadioTower}
          titulo="Sensores activos"
          valor={`${s.activos}/${s.total}`}
          subtitulo={`${s.inactivos} inactivos · ${s.sinSeñal} sin señal`}
          indicador={indicadorSensores}
          tono={tonoSensores}
        >
          <BarraProgreso
            porcentaje={porcentajeSensores}
            tono={tonoSensores}
            etiqueta="Sensores activos"
          />
        </KPICard>

        <KPICard
          icono={CalendarClock}
          titulo="Reservas activas"
          valor={kpis.reservadas}
          subtitulo="Plazas reservadas pendientes de ingreso"
          indicador={kpis.reservadas > 0 ? 'En curso' : 'Sin reservas'}
          tono="neutro"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <OcupacionSotanosCard sotanos={ocupacionSotanos} />
        </div>
        <div className="lg:col-span-3">
          <AlertasFeed alertas={alertas} onDescartar={descartarAlerta} />
        </div>
      </div>
    </div>
  )
}
