import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage, isApiError } from '../../../lib/errors'
import { consentScopeLabel, formatDateTime } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { listAppointments } from '../../scheduling/api'
import { listConsents } from '../../consent/api'
import { listClinicalNotes, listEhrAudit } from '../api'
import type { AppointmentResponse } from '../../../types/api'

function uniquePatients(appointments: AppointmentResponse[]) {
  const map = new Map<string, string>()
  for (const item of appointments) {
    if (!map.has(item.patientId)) {
      map.set(item.patientId, item.patientName)
    }
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }))
}

export function EhrPage() {
  const user = useAuthStore((state) => state.user)
  const isPatient = user?.role === 'PACIENTE'
  const isDoctor = user?.role === 'MEDICO'
  const [params, setParams] = useSearchParams()
  const selectedPatientId = isPatient ? user?.id : (params.get('patientId') ?? '')

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments,
    queryFn: listAppointments,
    enabled: isDoctor,
  })
  const consentsQuery = useQuery({
    queryKey: queryKeys.consents,
    queryFn: listConsents,
    enabled: isDoctor,
  })
  const notesQuery = useQuery({
    queryKey: queryKeys.ehr(selectedPatientId ?? ''),
    queryFn: () => listClinicalNotes(selectedPatientId as string),
    enabled: Boolean(selectedPatientId),
    retry: false,
  })
  const auditQuery = useQuery({
    queryKey: queryKeys.ehrAudit(selectedPatientId ?? ''),
    queryFn: () => listEhrAudit(selectedPatientId as string),
    enabled: isPatient && Boolean(selectedPatientId),
  })

  const patients = uniquePatients(appointmentsQuery.data ?? [])
  const patientNames = new Map(patients.map((patient) => [patient.id, patient.name]))
  const forbidden = isApiError(notesQuery.error) && notesQuery.error.status === 403
  const hasActiveConsent =
    Boolean(selectedPatientId) &&
    (consentsQuery.data?.some(
      (consent) =>
        consent.patientId === selectedPatientId &&
        !consent.revokedAt &&
        (consent.expiresAt == null || new Date(consent.expiresAt) > new Date()),
    ) ?? false)

  return (
    <div>
      <PageHeader
        title={isPatient ? 'Meu prontuário' : 'Prontuário do paciente'}
        description={
          isPatient
            ? 'Estas anotações ficam cifradas no servidor. Elas só são compartilhadas com um médico se você conceder consentimento.'
            : 'Sem consentimento do paciente, a API devolve apenas as suas próprias anotações — nunca o histórico completo.'
        }
      />

      {isPatient ? (
        <Alert className="mb-6">
          O histórico só é compartilhado com consentimento explícito.{' '}
          <Link to="/consentimentos" className="font-medium underline">
            Gerenciar consentimentos
          </Link>
        </Alert>
      ) : null}

      {isDoctor ? (
        <Card className="mb-6">
          <label htmlFor="patientId" className="text-sm font-medium text-slate-800">
            Paciente
          </label>
          <select
            id="patientId"
            className="mt-1.5 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            value={selectedPatientId}
            onChange={(event) => {
              const value = event.target.value
              if (value) {
                setParams({ patientId: value })
              } else {
                setParams({})
              }
            }}
          >
            <option value="">Selecione um paciente da sua agenda</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Abra também pela sala da consulta para registrar evolução no contexto certo.
          </p>
        </Card>
      ) : null}

      {!selectedPatientId && isDoctor ? (
        <EmptyState
          title="Escolha um paciente"
          description="O prontuário é aberto a partir da agenda ou da sala de consulta."
        />
      ) : null}

      {selectedPatientId && notesQuery.isPending ? <Spinner label="Carregando prontuário" /> : null}
      {forbidden ? (
        <Alert variant="warning" className="mb-4">
          Sem vínculo ou consentimento para este paciente. Solicite consentimento ao paciente para ver o histórico
          compartilhado.
        </Alert>
      ) : notesQuery.isError ? (
        <Alert variant="error">{errorMessage(notesQuery.error)}</Alert>
      ) : null}

      {isDoctor && selectedPatientId && !forbidden && !hasActiveConsent ? (
        <Alert variant="warning" className="mb-4">
          Não há consentimento ativo deste paciente. Você pode ver só as notas que você mesmo registrou. Peça ao
          paciente para conceder acesso em Consentimentos.
        </Alert>
      ) : null}

      {notesQuery.data?.length === 0 ? (
        <EmptyState
          title="Nenhuma evolução visível"
          description={
            isDoctor
              ? 'Registre a evolução na sala da consulta ou solicite consentimento para ver o histórico compartilhado.'
              : 'Quando um médico registrar evolução em uma consulta, ela aparece aqui.'
          }
        />
      ) : null}

      {isDoctor && (consentsQuery.data?.length ?? 0) > 0 ? (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900">Consentimentos recebidos</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {consentsQuery.data?.map((consent) => (
              <li key={consent.id}>
                {consent.patientName ?? patientNames.get(consent.patientId) ?? `Paciente ${consent.patientId.slice(0, 8)}`} ·{' '}
                {consentScopeLabel(consent.scope)} ·{' '}
                {consent.revokedAt ? 'revogado' : 'ativo'}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="space-y-3">
        {notesQuery.data?.map((note) => (
          <Card key={note.id} as="article">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-slate-900">{note.authorName ?? 'Médico'}</p>
              <p className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</p>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>
          </Card>
        ))}
      </div>

      {isPatient ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Quem acessou</h2>
          <p className="mb-4 text-sm text-slate-600">
            Registro de leituras e gravações no seu prontuário. Isso ajuda a acompanhar o uso dos seus dados de saúde.
          </p>
          {auditQuery.isPending ? <Spinner label="Carregando auditoria" /> : null}
          {auditQuery.isError ? <Alert variant="error">{errorMessage(auditQuery.error)}</Alert> : null}
          {auditQuery.data?.length === 0 ? (
            <EmptyState title="Nenhum acesso registrado ainda" />
          ) : (
            <ul className="space-y-2">
              {auditQuery.data?.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-slate-900">{entry.actorName ?? 'Usuário'}</span>
                  {' · '}
                  {entry.action === 'WRITE' ? 'registrou evolução' : 'leu o prontuário'}
                  {' · '}
                  <span className="text-slate-500">{formatDateTime(entry.accessedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
