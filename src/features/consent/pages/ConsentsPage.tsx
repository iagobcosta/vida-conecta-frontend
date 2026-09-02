import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { EmptyState } from '../../../components/EmptyState'
import { Field, inputClassName } from '../../../components/Field'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { consentScopeLabel, formatDateTime } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useToastStore } from '../../../stores/toastStore'
import { listAppointments, listDoctors } from '../../scheduling/api'
import { grantConsent, listConsents, revokeConsent } from '../api'

const schema = z
  .object({
    doctorId: z.string().min(1, 'Escolha o médico'),
    scope: z.enum(['DOCTOR', 'APPOINTMENT']),
    appointmentId: z.string().optional(),
    expiresAt: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.scope === 'APPOINTMENT' && !values.appointmentId) {
      ctx.addIssue({ code: 'custom', path: ['appointmentId'], message: 'Escolha a consulta' })
    }
  })

type FormValues = z.infer<typeof schema>

export function ConsentsPage() {
  const queryClient = useQueryClient()
  const pushToast = useToastStore((state) => state.push)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const consentsQuery = useQuery({ queryKey: queryKeys.consents, queryFn: listConsents })
  const doctorsQuery = useQuery({ queryKey: queryKeys.doctors, queryFn: listDoctors })
  const appointmentsQuery = useQuery({ queryKey: queryKeys.appointments, queryFn: listAppointments })

  const doctorNames = useMemo(() => {
    const map = new Map<string, string>()
    doctorsQuery.data?.forEach((doctor) => map.set(doctor.id, doctor.fullName))
    appointmentsQuery.data?.forEach((item) => map.set(item.doctorId, item.doctorName))
    return map
  }, [appointmentsQuery.data, doctorsQuery.data])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { doctorId: '', scope: 'DOCTOR', appointmentId: '', expiresAt: '' },
  })
  const scope = useWatch({ control: form.control, name: 'scope' })
  const selectedDoctor = useWatch({ control: form.control, name: 'doctorId' })

  const grantMutation = useMutation({
    mutationFn: (values: FormValues) =>
      grantConsent({
        doctorId: values.doctorId,
        scope: values.scope,
        appointmentId: values.scope === 'APPOINTMENT' ? values.appointmentId : undefined,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.consents })
      await queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
      form.reset({ doctorId: '', scope: 'DOCTOR', appointmentId: '', expiresAt: '' })
      pushToast('Consentimento concedido.')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: revokeConsent,
    onSuccess: async () => {
      setRevokeId(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.consents })
      await queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
      pushToast('Consentimento revogado. O médico deixa de ver o histórico compartilhado.', 'info')
    },
  })

  const relatedAppointments =
    appointmentsQuery.data?.filter(
      (item) => item.doctorId === selectedDoctor && item.status !== 'CANCELLED',
    ) ?? []

  return (
    <div>
      <PageHeader
        title="Consentimentos"
        description="O histórico clínico só é compartilhado com o médico quando você concede consentimento explícito. Você pode revogar a qualquer momento."
      />
      <Alert className="mb-6">
        Sem consentimento, o médico vê apenas as anotações que ele mesmo registrou. Nada do restante do prontuário é
        enviado ao navegador.
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Conceder acesso</h2>
          <form className="mt-4 space-y-4" onSubmit={form.handleSubmit((values) => grantMutation.mutate(values))} noValidate>
            {grantMutation.isError ? <Alert variant="error">{errorMessage(grantMutation.error)}</Alert> : null}
            <Field id="doctorId" label="Médico" error={form.formState.errors.doctorId?.message}>
              <select id="doctorId" className={inputClassName} {...form.register('doctorId')}>
                <option value="">Selecione</option>
                {doctorsQuery.data?.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName} · {doctor.specialty}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="scope" label="Alcance">
              <select id="scope" className={inputClassName} {...form.register('scope')}>
                <option value="DOCTOR">Todo o histórico com este médico</option>
                <option value="APPOINTMENT">Somente uma consulta</option>
              </select>
            </Field>
            {scope === 'APPOINTMENT' ? (
              <Field id="appointmentId" label="Consulta" error={form.formState.errors.appointmentId?.message}>
                <select id="appointmentId" className={inputClassName} {...form.register('appointmentId')}>
                  <option value="">Selecione</option>
                  {relatedAppointments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {formatDateTime(item.scheduledAt)} · {item.doctorName}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field id="expiresAt" label="Expira em (opcional)">
              <input id="expiresAt" type="datetime-local" className={inputClassName} {...form.register('expiresAt')} />
            </Field>
            <Button type="submit" disabled={grantMutation.isPending}>
              {grantMutation.isPending ? 'Salvando…' : 'Conceder consentimento'}
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Já concedidos</h2>
          {consentsQuery.isPending ? <Spinner label="Carregando consentimentos" /> : null}
          {consentsQuery.isError ? <Alert variant="error">{errorMessage(consentsQuery.error)}</Alert> : null}
          {revokeMutation.isError ? <Alert variant="error">{errorMessage(revokeMutation.error)}</Alert> : null}
          {consentsQuery.data?.length === 0 ? (
            <EmptyState title="Nenhum consentimento ativo" description="Conceda acesso a um médico para compartilhar o histórico." />
          ) : null}
          <div className="space-y-3">
            {consentsQuery.data?.map((consent) => {
              const revoked = Boolean(consent.revokedAt)
              return (
                <Card key={consent.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {consent.doctorName ?? doctorNames.get(consent.doctorId) ?? 'Médico'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {consentScopeLabel(consent.scope)} · v{consent.version} · {formatDateTime(consent.grantedAt)}
                      </p>
                    </div>
                    <Badge tone={revoked ? 'danger' : 'success'}>{revoked ? 'Revogado' : 'Ativo'}</Badge>
                  </div>
                  {!revoked ? (
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="danger"
                      onClick={() => setRevokeId(consent.id)}
                    >
                      Revogar
                    </Button>
                  ) : null}
                </Card>
              )
            })}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(revokeId)}
        title="Revogar consentimento?"
        description="O médico deixa de ver o histórico compartilhado. As anotações que ele mesmo registrou continuam visíveis para ele."
        confirmLabel="Revogar"
        danger
        busy={revokeMutation.isPending}
        onCancel={() => setRevokeId(null)}
        onConfirm={() => {
          if (revokeId) {
            revokeMutation.mutate(revokeId)
          }
        }}
      />
    </div>
  )
}
