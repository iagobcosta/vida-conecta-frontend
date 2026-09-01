import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Field, inputClassName } from '../../../components/Field'
import { errorMessage } from '../../../lib/errors'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { fetchMe, login } from '../api'
import { loginSchema, type LoginFormValues } from '../schema'

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const tokens = await login(values)
      useAuthStore.setState({ token: tokens.token })
      const user = await fetchMe()
      setSession(tokens.token, user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
    onSuccess: () => navigate('/agenda', { replace: true }),
  })

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-900">Entrar</h1>
      <p className="mt-1 text-sm text-slate-600">Use o e-mail e a senha da sua conta Vida Conecta.</p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        {mutation.isError ? <Alert variant="error">{errorMessage(mutation.error)}</Alert> : null}
        <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            {...form.register('email')}
          />
        </Field>
        <Field id="password" label="Senha" error={form.formState.errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            {...form.register('password')}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Novo por aqui?{' '}
        <Link to="/cadastro" className="font-medium text-teal-800 hover:underline">
          Criar conta
        </Link>
      </p>
    </Card>
  )
}
