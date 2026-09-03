import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { AppointmentStatusBadge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { Field, inputClassName } from '../../../components/Field'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage, isApiError } from '../../../lib/errors'
import { formatDateTime, joinWindowLabel } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import { getAppointment, completeAppointment } from '../../scheduling/api'
import { createClinicalNote, listClinicalNotes } from '../../ehr/api'
import { createPrescription, listPrescriptions } from '../../prescription/api'
import { requestVideoToken } from '../api'
import { JitsiMeeting } from '../components/JitsiMeeting'

export function ConsultationPage() {
  const { appointmentId = '' } = useParams()
  const user = useAuthStore((state) => state.user)
  const isDoctor = user?.role === 'MEDICO'
  const queryClient = useQueryClient()
  const pushToast = useToastStore((state) => state.push)
  const [inCall, setInCall] = useState(false)
  const [roomName, setRoomName] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [instructions, setInstructions] = useState('')

  const appointmentQuery = useQuery({
    queryKey: queryKeys.appointment(appointmentId),
    queryFn: () => getAppointment(appointmentId),
    enabled: Boolean(appointmentId),
  })

  const appointment = appointmentQuery.data
  const patientId = appointment?.patientId

  const notesQuery = useQuery({
    queryKey: queryKeys.ehr(patientId ?? '', appointmentId),
    queryFn: () => listClinicalNotes(patientId as string, appointmentId),
    enabled: Boolean(patientId),
    retry: false,
  })

  const prescriptionsQuery = useQuery({
    queryKey: queryKeys.prescriptions,
    queryFn: listPrescriptions,
  })

  const joinMutation = useMutation({
    mutationFn: () => requestVideoToken(appointmentId),
    onSuccess: (token) => {
      setRoomName(token.roomName)
      setInCall(true)
      pushToast('Entrando na videochamada.')
    },
  })

  const noteMutation = useMutation({
    mutationFn: () => createClinicalNote(patientId as string, { appointmentId, content: note.trim() }),
    onSuccess: async () => {
      setNote('')
      await queryClient.invalidateQueries({ queryKey: ['ehr'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
      pushToast('Evolução registrada.')
    },
  })
  const rxMutation = useMutation({
    mutationFn: () =>
      createPrescription({
        patientId: patientId as string,
        appointmentId,
        items: [{ medication: medication.trim(), dosage: dosage.trim(), instructions: instructions.trim() }],
      }),
    onSuccess: async () => {
      setMedication('')
      setDosage('')
      setInstructions('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions })
      await queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
      pushToast('Receita emitida.')
    },
  })
  const completeMutation = useMutation({
    mutationFn: () => completeAppointment(appointmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointment(appointmentId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
      pushToast('Consulta concluída.')
    },
  })

  function leaveCall() {
    setInCall(false)
    setRoomName(null)
  }

  const relatedPrescriptions =
    prescriptionsQuery.data?.filter((item) => item.appointmentId === appointmentId) ?? []
  const notesForbidden = isApiError(notesQuery.error) && notesQuery.error.status === 403
  const displayName = user?.fullName?.trim() || user?.email || 'Participante'
  const canJoin = Boolean(appointment?.canJoinNow)

  return (
    <div>
      <PageHeader
        title="Sala da consulta"
        description="Videochamada via Jitsi Meet. A sala só abre com a consulta confirmada e dentro da janela do horário."
        actions={
          <Link to="/agenda">
            <Button variant="secondary">Voltar à agenda</Button>
          </Link>
        }
      />

      {appointmentQuery.isPending ? <Spinner label="Carregando consulta" /> : null}
      {appointmentQuery.isError ? <Alert variant="error">{errorMessage(appointmentQuery.error)}</Alert> : null}

      {appointment ? (
        <Card className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">
                {formatDateTime(appointment.scheduledAt)} · {appointment.durationMinutes} min
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {isDoctor ? appointment.patientName : appointment.doctorName}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {joinWindowLabel(
                  appointment.joinOpensAt,
                  appointment.joinClosesAt,
                  appointment.canJoinNow,
                  appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS',
                )}
              </p>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          {isDoctor && (appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS') ? (
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              {completeMutation.isPending ? 'Encerrando…' : 'Concluir consulta'}
            </Button>
          ) : null}
          {completeMutation.isError ? (
            <Alert variant="error" className="mt-3">{errorMessage(completeMutation.error)}</Alert>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Videochamada</h2>
          <p className="mt-1 text-sm text-slate-600">
            A sala abre se a consulta estiver confirmada e dentro da janela (10 minutos antes até o fim do horário).
          </p>

          {inCall && roomName ? (
            <div className="mt-4 space-y-3">
              <JitsiMeeting roomName={roomName} displayName={displayName} onLeft={leaveCall} />
              <Button variant="secondary" onClick={leaveCall}>
                Sair da videochamada
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex aspect-video min-h-[220px] items-center justify-center rounded-lg bg-slate-900 px-4 text-center text-sm text-slate-300">
                {canJoin
                  ? 'Quando estiver pronto, entre na sala. Médico e paciente usam o mesmo identificador da consulta.'
                  : 'A videochamada fica disponível após a confirmação e na janela do horário marcado.'}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending || !canJoin}
                >
                  {joinMutation.isPending ? 'Autorizando sala…' : 'Entrar na videochamada'}
                </Button>
              </div>
            </div>
          )}

          {joinMutation.isError ? (
            <Alert variant="warning" className="mt-3">
              {errorMessage(joinMutation.error)}{' '}
              {isApiError(joinMutation.error) && joinMutation.error.status === 403
                ? 'Confirme a consulta e tente na janela do horário marcado.'
                : null}
            </Alert>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Prontuário</h2>
              {patientId && isDoctor ? (
                <Link to={`/prontuario?patientId=${patientId}`} className="text-sm font-medium text-teal-800 hover:underline">
                  Ver completo
                </Link>
              ) : (
                <Link to="/prontuario" className="text-sm font-medium text-teal-800 hover:underline">
                  Meu prontuário
                </Link>
              )}
            </div>
            {notesForbidden ? (
              <Alert variant="warning" className="mt-3">
                Sem consentimento para o histórico compartilhado. Solicite consentimento ao paciente.
              </Alert>
            ) : notesQuery.isError ? (
              <Alert variant="error" className="mt-3">{errorMessage(notesQuery.error)}</Alert>
            ) : null}
            {notesQuery.isPending ? <Spinner className="mt-4" label="Carregando notas" /> : null}
            {notesQuery.data?.length === 0 ? (
              <EmptyState className="mt-3" title="Nenhuma evolução visível nesta consulta" />
            ) : (
              <ul className="mt-3 space-y-3">
                {notesQuery.data?.map((item) => (
                  <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-900">{item.authorName ?? 'Médico'}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                    <p className="mt-2 whitespace-pre-wrap text-slate-700">{item.content}</p>
                  </li>
                ))}
              </ul>
            )}
            {isDoctor ? (
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (note.trim()) {
                    noteMutation.mutate()
                  }
                }}
              >
                {noteMutation.isError ? <Alert variant="error">{errorMessage(noteMutation.error)}</Alert> : null}
                <Field id="note" label="Evolução desta consulta">
                  <textarea
                    id="note"
                    rows={4}
                    className={inputClassName}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    required
                  />
                </Field>
                <Button type="submit" disabled={noteMutation.isPending || !note.trim()}>
                  {noteMutation.isPending ? 'Salvando…' : 'Registrar evolução'}
                </Button>
              </form>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Receita</h2>
            {relatedPrescriptions.length === 0 ? (
              <EmptyState className="mt-3" title="Nenhuma receita nesta consulta" />
            ) : (
              <ul className="mt-3 space-y-2">
                {relatedPrescriptions.map((rx) => (
                  <li key={rx.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    {rx.items.map((item, index) => (
                      <p key={`${rx.id}-${index}`}>
                        <span className="font-medium">{item.medication}</span> · {item.dosage} — {item.instructions}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
            {isDoctor ? (
              <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  rxMutation.mutate()
                }}
              >
                {rxMutation.isError ? <Alert variant="error">{errorMessage(rxMutation.error)}</Alert> : null}
                <Field id="medication" label="Medicamento">
                  <input
                    id="medication"
                    className={inputClassName}
                    value={medication}
                    onChange={(event) => setMedication(event.target.value)}
                    required
                  />
                </Field>
                <Field id="dosage" label="Dosagem">
                  <input
                    id="dosage"
                    className={inputClassName}
                    value={dosage}
                    onChange={(event) => setDosage(event.target.value)}
                    required
                  />
                </Field>
                <Field id="instructions" label="Instruções">
                  <input
                    id="instructions"
                    className={inputClassName}
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    required
                  />
                </Field>
                <Button
                  type="submit"
                  disabled={rxMutation.isPending || !medication.trim() || !dosage.trim() || !instructions.trim()}
                >
                  {rxMutation.isPending ? 'Emitindo…' : 'Emitir receita'}
                </Button>
              </form>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  )
}
