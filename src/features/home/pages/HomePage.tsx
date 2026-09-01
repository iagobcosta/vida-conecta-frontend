import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { AppointmentStatusBadge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { formatDateTime, formatRelativeTime, joinWindowLabel, roleLabel } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { listAppointments } from '../../scheduling/api'
import { listConsents } from '../../consent/api'
import { AdminDashboardPage } from '../../admin/pages/AdminDashboardPage'
import type { AppointmentResponse } from '../../../types/api'

function nextAppointment(appointments: AppointmentResponse[]) {
  const now = Date.now()
  return [...appointments]
    .filter((item) => item.status !== 'CANCELLED' && item.status !== 'COMPLETED')
    .filter((item) => new Date(item.joinClosesAt).getTime() >= now || item.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
}

export function HomePage() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const nextBootstrapToken = (location.state as { nextBootstrapToken?: string } | null)?.nextBootstrapToken
  const isPatient = user?.role === 'PACIENTE'
  const isDoctor = user?.role === 'MEDICO'
  const isAdmin = user?.role === 'ADMIN'
  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments,
    queryFn: listAppointments,
    enabled: !isAdmin,
  })
  const consentsQuery = useQuery({
    queryKey: queryKeys.consents,
    queryFn: listConsents,
    enabled: isPatient,
  })

  const upcoming = nextAppointment(appointmentsQuery.data ?? [])
  const pendingConfirmations = useMemo(
    () => (appointmentsQuery.data ?? []).filter((item) => item.status === 'SCHEDULED').length,
    [appointmentsQuery.data],
  )
  const activeConsents = useMemo(
    () => (consentsQuery.data ?? []).filter((item) => !item.revokedAt).length,
    [consentsQuery.data],
  )

  if (isAdmin) {
    return (
      <div>
        {nextBootstrapToken ? (
          <Alert className="mb-6" variant="success">
            Guarde o próximo token de cadastro de admin:{' '}
            <span className="break-all font-mono text-sm">{nextBootstrapToken}</span>
          </Alert>
        ) : null}
        <AdminDashboardPage />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`Olá, ${user?.fullName?.split(' ')[0] ?? 'bem-vindo'}`}
        description={`${roleLabel(user?.role ?? 'PACIENTE')} · ${user?.email}`}
      />

      {user?.cpf ? (
        <Alert className="mb-6">
          CPF na conta: {user.cpf}. O número completo fica só no servidor, mascarado nesta tela.
        </Alert>
      ) : null}

      {appointmentsQuery.isPending ? <Spinner label="Carregando início" /> : null}
      {appointmentsQuery.isError ? <Alert variant="error">{errorMessage(appointmentsQuery.error)}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm font-medium text-slate-500">Próxima consulta</p>
          {upcoming ? (
            <>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {isPatient ? upcoming.doctorName : upcoming.patientName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDateTime(upcoming.scheduledAt)} · {formatRelativeTime(upcoming.scheduledAt)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {joinWindowLabel(
                  upcoming.joinOpensAt,
                  upcoming.joinClosesAt,
                  upcoming.canJoinNow,
                  upcoming.status === 'CONFIRMED' || upcoming.status === 'IN_PROGRESS',
                )}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <AppointmentStatusBadge status={upcoming.status} />
                <Link to={`/consulta/${upcoming.id}`}>
                  <Button size="sm">{upcoming.canJoinNow ? 'Entrar na sala' : 'Abrir consulta'}</Button>
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              className="mt-3"
              title="Nada agendado"
              description={isPatient ? 'Marque uma consulta para começar.' : 'Aguardando pacientes na agenda.'}
              action={
                isPatient ? (
                  <Link to="/agenda/nova">
                    <Button size="sm">Agendar</Button>
                  </Link>
                ) : (
                  <Link to="/agenda">
                    <Button size="sm">Ver agenda</Button>
                  </Link>
                )
              }
            />
          )}
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Atalhos</p>
          <ul className="mt-3 space-y-2 text-sm">
            {isDoctor ? (
              <>
                <li>
                  {pendingConfirmations > 0
                    ? `${pendingConfirmations} consulta(s) aguardando confirmação.`
                    : 'Nenhuma consulta pendente de confirmação.'}{' '}
                  <Link to="/agenda" className="font-medium text-teal-800 hover:underline">
                    Abrir agenda
                  </Link>
                </li>
                <li>
                  <Link to="/horarios" className="font-medium text-teal-800 hover:underline">
                    Cadastrar horários de atendimento
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  {activeConsents > 0
                    ? `${activeConsents} consentimento(s) ativo(s).`
                    : 'Nenhum consentimento ativo — o histórico não é compartilhado.'}{' '}
                  <Link to="/consentimentos" className="font-medium text-teal-800 hover:underline">
                    Gerenciar
                  </Link>
                </li>
                <li>
                  <Link to="/agenda/nova" className="font-medium text-teal-800 hover:underline">
                    Agendar consulta
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link to="/prontuario" className="font-medium text-teal-800 hover:underline">
                {isPatient ? 'Ver meu prontuário' : 'Abrir prontuário'}
              </Link>
            </li>
            <li>
              <Link to="/receitas" className="font-medium text-teal-800 hover:underline">
                {isPatient ? 'Minhas receitas' : 'Receitas emitidas'}
              </Link>
            </li>
          </ul>
          {isPatient ? (
            <p className="mt-4 text-xs text-slate-500">
              Dados de saúde só são compartilhados com consentimento explícito, versionado e revogável.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
