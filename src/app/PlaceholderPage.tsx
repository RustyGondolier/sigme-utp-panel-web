type PlaceholderPageProps = {
  rfa: string
  titulo: string
}

export function PlaceholderPage({ rfa, titulo }: PlaceholderPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="bg-brand-100 text-brand-800 inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold">
          {rfa}
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">{titulo}</h1>
        <p className="mt-2 text-sm text-slate-500">Pantalla pendiente de implementacion.</p>
      </div>
    </main>
  )
}
