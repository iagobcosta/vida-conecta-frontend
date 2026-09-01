import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Field, inputClassName } from '../../../components/Field'
import { PasswordInput } from '../../../components/PasswordInput'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { completeDoctorRegistration, fetchMe, previewDoctorInvite } from '../api'
import { completeDoctorSchema, type CompleteDoctorFormValues } from '../schema'

export function CompleteDoctorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const form = useForm<CompleteDoctorFormValues>({
    resolver: zodResolver(completeDoctorSchema),
    defaultValues: { password: '', crm: '', specialty: '' },
  })

  const previewQuery = useQuery({
    queryKey: queryKeys.doctorInvite(token),
    queryFn: () => previewDoctorInvite(token),
    enabled: Boolean(token),
  })

  const mutation = useMutation({
    mutationFn: async (values: CompleteDoctorFormValues) => {
      const tokens = await completeDoctorRegistration({ token, ...values })
      useAuthStore.setState({ token: tokens.token })
      const user = await fetchMe()
      setSession(tokens.token, user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
    onSuccess: () => navigate('/inicio', { replace: true }),
  })

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-900">Concluir cadastro de médico</h1>
      {!token ? (
        <Alert variant="error" className="mt-4">
          Link inválido. Peça um novo convite ao administrador.
        </Alert>
      ) : null}
      {token && previewQuery.isPending ? <Spinner className="mt-6" label="Validando convite" /> : null}
      {previewQuery.isError ? <Alert variant="error" className="mt-4">{errorMessage(previewQuery.error)}</Alert> : null}
      {previewQuery.data ? (
        <>
          <p className="mt-2 text-sm text-slate-600">
            Olá, <strong>{previewQuery.data.fullName}</strong>. Confirme seus dados profissionais para acessar a
            plataforma com <strong>{previewQuery.data.email}</strong>.
          </p>
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
            {mutation.isError ? <Alert variant="error">{errorMessage(mutation.error)}</Alert> : null}
            <Field id="crm" label="CRM" error={form.formState.errors.crm?.message}>
              <input id="crm" className={inputClassName} {...form.register('crm')} />
            </Field>
            <Field id="specialty" label="Especialidade" error={form.formState.errors.specialty?.message}>
              <input id="specialty" className={inputClassName} {...form.register('specialty')} />
            </Field>
            <Field id="password" label="Senha" hint="Mínimo de 8 caracteres" error={form.formState.errors.password?.message}>
              <PasswordInput id="password" autoComplete="new-password" {...form.register('password')} />
            </Field>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando…' : 'Concluir cadastro'}
            </Button>
          </form>
        </>
      ) : null}
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link to="/login" className="font-medium text-teal-800 hover:underline">
          Já concluiu? Entrar
        </Link>
      </p>
    </Card>
  )
}
