import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Field, inputClassName } from '../../../components/Field'
import { PasswordInput } from '../../../components/PasswordInput'
import { errorMessage } from '../../../lib/errors'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { fetchMe, registerAdmin } from '../api'
import { adminRegisterSchema, type AdminRegisterFormValues } from '../schema'

export function AdminRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const form = useForm<AdminRegisterFormValues>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      token: searchParams.get('token') ?? '',
      fullName: '',
      email: '',
      password: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: AdminRegisterFormValues) => {
      const tokens = await registerAdmin(values)
      useAuthStore.setState({ token: tokens.token })
      const user = await fetchMe()
      setSession(tokens.token, user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.me })
      return tokens
    },
    onSuccess: (tokens) => navigate('/inicio', { replace: true, state: { nextBootstrapToken: tokens.nextBootstrapToken } }),
  })

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-900">Cadastro de administrador</h1>
      <p className="mt-1 text-sm text-slate-600">
        Use o token UUID vigente no banco. Depois do cadastro ele é substituído por um novo.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        {mutation.isError ? <Alert variant="error">{errorMessage(mutation.error)}</Alert> : null}
        <Field id="token" label="Token de cadastro" error={form.formState.errors.token?.message}>
          <input id="token" className={inputClassName} autoComplete="off" {...form.register('token')} />
        </Field>
        <Field id="fullName" label="Nome completo" error={form.formState.errors.fullName?.message}>
          <input id="fullName" className={inputClassName} autoComplete="name" {...form.register('fullName')} />
        </Field>
        <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <input id="email" type="email" className={inputClassName} autoComplete="email" {...form.register('email')} />
        </Field>
        <Field id="password" label="Senha" hint="Mínimo de 8 caracteres" error={form.formState.errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando conta…' : 'Cadastrar administrador'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link to="/login" className="font-medium text-teal-800 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </Card>
  )
}
