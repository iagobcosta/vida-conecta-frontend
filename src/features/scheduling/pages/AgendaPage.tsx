import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { AppointmentStatusBadge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { EmptyState } from '../../../components/EmptyState'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { formatDateTime, joinWindowLabel } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import { cancelAppointment, confirmAppointment, listAppointments } from '../api'
import { cn } from '../../../lib/cn'
import type { AppointmentResponse } from '../../../types/api'

type AgendaFilter = 'proximas' | 'pendentes' | 'encerradas'

function matchesFilter(appointment: AppointmentResponse, filter: AgendaFilter) {
  if (filter === 'pendentes') {
    return appointment.status === 'SCHEDULED'
  }
  if (filter === 'encerradas') {
    return appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED'
  }
  return appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS'
}

export function AgendaPage() {
  const role = useAuthStore((state) => state.user?.role)
  const isPatient = role === 'PACIENTE'
  const isDoctor = role === 'MEDICO'
  const queryClient = useQueryClient()
  const pushToast = useToastStore((state) => state.push)
  const [filter, setFilter] = useState<AgendaFilter>('proximas')
  const [cancelId, setCancelId] = useState<string | null>(null)

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments,
    queryFn: listAppointments,
  })

  const confirmMutation = useMutation({
    mutationFn: confirmAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
      pushToast('Consulta confirmada. A sala abre na janela do horário.')
    },
  })
  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: async () => {
      setCancelId(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
      pushToast('Consulta cancelada.', 'info')
    },
  })

  const visible = useMemo(
    () => (appointmentsQuery.data ?? []).filter((item) => matchesFilter(item, filter)),
    [appointmentsQuery.data, filter],
  )
  const actionError = confirmMutation.error ?? cancelMutation.error

  return (
    <div>
      <PageHeader
        title="Agenda"
        description={
          isPatient
            ? 'Marque consultas e acompanhe o status. O médico precisa confirmar antes da sala abrir.'
            : 'Confirme ou cancele consultas. A sala só fica disponível após a confirmação e na janela do horário.'
        }
        actions={
          isPatient ? (
            <Link to="/agenda/nova">
              <Button>Agendar consulta</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtro da agenda">
        {(
          [
            ['proximas', 'Próximas'],
            ['pendentes', isDoctor ? 'A confirmar' : 'Aguardando médico'],
            ['encerradas', 'Encerradas'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm',
              filter === id ? 'bg-teal-800 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200',
            )}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {appointmentsQuery.isPending ? <Spinner label="Carregando agenda" /> : null}
      {appointmentsQuery.isError ? <Alert variant="error">{errorMessage(appointmentsQuery.error)}</Alert> : null}
      {actionError ? <Alert variant="error">{errorMessage(actionError)}</Alert> : null}

      {!appointmentsQuery.isPending && visible.length === 0 ? (
        <EmptyState
          title="Nenhuma consulta neste filtro"
          description={isPatient ? 'Escolha um médico e um horário futuro.' : 'Quando um paciente agendar, a consulta aparece aqui.'}
          action={
            isPatient ? (
              <Link to="/agenda/nova">
                <Button>Agendar consulta</Button>
              </Link>
            ) : null
          }
        />
      ) : null}

      <div className="grid gap-3">
        {visible.map((appointment) => {
          const canCancel = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED'
          const canConfirm = isDoctor && appointment.status === 'SCHEDULED'
          const confirmed = appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS'
          return (
            <Card key={appointment.id} as="article">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {isPatient ? appointment.doctorName : appointment.patientName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(appointment.scheduledAt)} · {appointment.durationMinutes} min
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {joinWindowLabel(
                      appointment.joinOpensAt,
                      appointment.joinClosesAt,
                      appointment.canJoinNow,
                      confirmed,
                    )}
                  </p>
                </div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/consulta/${appointment.id}`}>
                  <Button size="sm" variant={appointment.canJoinNow ? 'primary' : 'secondary'}>
                    {appointment.canJoinNow ? 'Entrar na consulta' : 'Abrir consulta'}
                  </Button>
                </Link>
                {canConfirm ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={confirmMutation.isPending}
                    onClick={() => confirmMutation.mutate(appointment.id)}
                  >
                    Confirmar
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button size="sm" variant="danger" onClick={() => setCancelId(appointment.id)}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancelar consulta?"
        description="O horário será liberado e a sala não poderá ser aberta."
        confirmLabel="Cancelar consulta"
        danger
        busy={cancelMutation.isPending}
        onCancel={() => setCancelId(null)}
        onConfirm={() => {
          if (cancelId) {
            cancelMutation.mutate(cancelId)
          }
        }}
      />
    </div>
  )
}
