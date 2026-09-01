import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { AppointmentStatusBadge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage, isApiError } from '../../../lib/errors'
import { formatDateTime } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { cancelAppointment, confirmAppointment, listAppointments } from '../api'

export function AgendaPage() {
  const role = useAuthStore((state) => state.user?.role)
  const isPatient = role === 'PACIENTE'
  const isDoctor = role === 'MEDICO'
  const queryClient = useQueryClient()
  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments,
    queryFn: listAppointments,
  })

  const confirmMutation = useMutation({
    mutationFn: confirmAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments }),
  })
  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments }),
  })

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

      {appointmentsQuery.isPending ? <Spinner label="Carregando agenda" /> : null}
      {appointmentsQuery.isError ? <Alert variant="error">{errorMessage(appointmentsQuery.error)}</Alert> : null}
      {actionError ? <Alert variant="error">{errorMessage(actionError)}</Alert> : null}

      {appointmentsQuery.data && appointmentsQuery.data.length === 0 ? (
        <EmptyState
          title="Nenhuma consulta por aqui"
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
        {appointmentsQuery.data?.map((appointment) => {
          const canCancel = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED'
          const canConfirm = isDoctor && appointment.status === 'SCHEDULED'
          const canJoin =
            appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS'
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
                </div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {canJoin ? (
                  <Link to={`/consulta/${appointment.id}`}>
                    <Button size="sm">Entrar na consulta</Button>
                  </Link>
                ) : (
                  <Link to={`/consulta/${appointment.id}`}>
                    <Button size="sm" variant="secondary">
                      Abrir consulta
                    </Button>
                  </Link>
                )}
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
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(appointment.id)}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>
      {isApiError(actionError) && actionError.details.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">{actionError.details.join(' ')}</p>
      ) : null}
    </div>
  )
}
