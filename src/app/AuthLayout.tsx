import { Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-slate-50">
      <div className="mx-auto grid min-h-svh max-w-6xl lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-teal-800 p-10 text-teal-50 lg:flex">
          <Logo light />
          <div>
            <h1 className="text-3xl font-semibold leading-tight">Telemedicina para o consultório</h1>
            <p className="mt-3 max-w-md text-sm text-teal-100">
              Agenda, consentimento explícito, prontuário e consulta em um fluxo simples — alinhado à LGPD.
            </p>
          </div>
          <p className="text-xs text-teal-200">Vida Conecta · MVP</p>
        </aside>
        <main className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <Logo />
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
