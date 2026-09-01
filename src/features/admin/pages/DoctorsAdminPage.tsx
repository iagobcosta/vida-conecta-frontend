import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { Field, inputClassName } from '../../../components/Field'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { formatDateTime } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { fetchBootstrapToken, inviteDoctor, listDoctorInvites, listManagedDoctors } from '../../auth/api'
import { inviteDoctorSchema, type InviteDoctorFormValues } from '../../auth/schema'
import type { DoctorInviteResponse } from '../../../types/api'

const statusLabel: Record<DoctorInviteResponse['status'], string> = {
  PENDING: 'Aguardando cadastro',
  ACCEPTED: 'Cadastro concluído',
  EXPIRED: 'Expirado',
}

export function DoctorsAdminPage() {
  const queryClient = useQueryClient()
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const form = useForm<InviteDoctorFormValues>({
    resolver: zodResolver(inviteDoctorSchema),
    defaultValues: { fullName: '', email: '' },
  })

  const doctorsQuery = useQuery({ queryKey: queryKeys.adminDoctors, queryFn: listManagedDoctors })
  const invitesQuery = useQuery({ queryKey: queryKeys.adminInvites, queryFn: listDoctorInvites })
  const bootstrapQuery = useQuery({ queryKey: queryKeys.adminBootstrapToken, queryFn: fetchBootstrapToken })

  const inviteMutation = useMutation({
    mutationFn: (values: InviteDoctorFormValues) => inviteDoctor(values),
    onSuccess: async (invite) => {
      setLastInviteUrl(invite.inviteUrl)
      form.reset()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminInvites }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors }),
      ])
    },
  })

  return (
    <div>
      <PageHeader
        title="Médicos"
        description="Cadastre o nome e o e-mail. O médico recebe o convite por e-mail e conclui CRM, especialidade e senha."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Convidar médico</h2>
          <form className="mt-4 space-y-4" onSubmit={form.handleSubmit((values) => inviteMutation.mutate(values))}>
            {inviteMutation.isError ? <Alert variant="error">{errorMessage(inviteMutation.error)}</Alert> : null}
            <Field id="fullName" label="Nome completo" error={form.formState.errors.fullName?.message}>
              <input id="fullName" className={inputClassName} {...form.register('fullName')} />
            </Field>
            <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
              <input id="email" type="email" className={inputClassName} {...form.register('email')} />
            </Field>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </form>
          {lastInviteUrl ? (
            <Alert variant="success" className="mt-4">
              Convite gerado. Se o e-mail não chegar, envie este link:{' '}
              <span className="break-all font-medium">{lastInviteUrl}</span>
            </Alert>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">Token para novo admin</h2>
          <p className="mt-2 text-sm text-slate-600">
            Quem for cadastrar outro administrador precisa deste UUID. Depois do uso, o sistema gera outro.
          </p>
          {bootstrapQuery.isPending ? <Spinner className="mt-4" label="Carregando token" /> : null}
          {bootstrapQuery.isError ? <Alert variant="error" className="mt-4">{errorMessage(bootstrapQuery.error)}</Alert> : null}
          {bootstrapQuery.data ? (
            <p className="mt-4 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
              {bootstrapQuery.data.token}
            </p>
          ) : null}
        </Card>
      </div>

      <h2 className="mt-8 text-base font-semibold text-slate-900">Convites</h2>
      {invitesQuery.isPending ? <Spinner className="mt-3" label="Carregando convites" /> : null}
      {invitesQuery.data?.length === 0 ? (
        <EmptyState className="mt-3" title="Nenhum convite" description="Os convites enviados aparecem aqui." />
      ) : (
        <div className="mt-3 space-y-3">
          {invitesQuery.data?.map((invite) => (
            <Card key={invite.id}>
              <p className="font-medium text-slate-900">{invite.fullName}</p>
              <p className="mt-1 text-sm text-slate-600">{invite.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                {statusLabel[invite.status]} · válido até {formatDateTime(invite.expiresAt)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-base font-semibold text-slate-900">Médicos ativos</h2>
      {doctorsQuery.isPending ? <Spinner className="mt-3" label="Carregando médicos" /> : null}
      {doctorsQuery.data?.length === 0 ? (
        <EmptyState className="mt-3" title="Nenhum médico cadastrado" description="Quando o convite for aceito, o médico aparece nesta lista." />
      ) : (
        <div className="mt-3 space-y-3">
          {doctorsQuery.data?.map((doctor) => (
            <Card key={doctor.id}>
              <p className="font-medium text-slate-900">{doctor.fullName}</p>
              <p className="mt-1 text-sm text-slate-600">
                {doctor.specialty} · CRM {doctor.crm}
              </p>
              {doctor.email ? <p className="mt-1 text-xs text-slate-500">{doctor.email}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
