import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { cn } from '../lib/cn'
import { roleLabel } from '../lib/formatters'
import { useAuthStore } from '../stores/authStore'

const patientLinks = [
  { to: '/agenda', label: 'Agenda' },
  { to: '/consentimentos', label: 'Consentimentos' },
  { to: '/prontuario', label: 'Meu prontuário' },
  { to: '/receitas', label: 'Minhas receitas' },
]

const doctorLinks = [
  { to: '/agenda', label: 'Agenda' },
  { to: '/prontuario', label: 'Prontuário' },
  { to: '/receitas', label: 'Receitas' },
]

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const navigate = useNavigate()
  const links = user?.role === 'MEDICO' ? doctorLinks : patientLinks

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-slate-50">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-teal-50 text-teal-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.fullName ?? user?.email}</p>
              <p className="text-xs text-slate-500">{user ? roleLabel(user.role) : ''}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
        <nav aria-label="Principal móvel" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm',
                  isActive ? 'bg-teal-50 text-teal-900' : 'text-slate-600',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-8">
        {user?.role === 'ADMIN' ? (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            O painel administrativo não faz parte deste MVP. Use uma conta de paciente ou médico.
          </p>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
