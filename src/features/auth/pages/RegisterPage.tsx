import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Field, inputClassName } from '../../../components/Field'
import { PasswordInput } from '../../../components/PasswordInput'
import { errorMessage } from '../../../lib/errors'
import { formatCpfInput, formatPhoneInput } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { fetchMe, register } from '../api'
import { registerSchema, type RegisterFormValues } from '../schema'

export function RegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      cpf: '',
      birthDate: '',
      phone: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const tokens = await register({
        email: values.email,
        password: values.password,
        role: 'PACIENTE',
        fullName: values.fullName,
        cpf: values.cpf.replace(/\D/g, ''),
        birthDate: values.birthDate,
        phone: values.phone || undefined,
      })
      useAuthStore.setState({ token: tokens.token })
      const user = await fetchMe()
      setSession(tokens.token, user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
    onSuccess: () => navigate('/inicio', { replace: true }),
  })

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-900">Criar conta de paciente</h1>
      <p className="mt-1 text-sm text-slate-600">
        Médicos entram por convite do administrador. Se você já recebeu o e-mail, use o link para concluir o cadastro.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        {mutation.isError ? <Alert variant="error">{errorMessage(mutation.error)}</Alert> : null}
        <Field id="fullName" label="Nome completo" error={form.formState.errors.fullName?.message}>
          <input id="fullName" className={inputClassName} autoComplete="name" {...form.register('fullName')} />
        </Field>
        <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <input id="email" type="email" className={inputClassName} autoComplete="email" {...form.register('email')} />
        </Field>
        <Field id="password" label="Senha" hint="Mínimo de 8 caracteres" error={form.formState.errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Field id="cpf" label="CPF" error={form.formState.errors.cpf?.message}>
          <input
            id="cpf"
            inputMode="numeric"
            autoComplete="off"
            className={inputClassName}
            {...form.register('cpf', {
              onChange: (event) => {
                event.target.value = formatCpfInput(event.target.value)
              },
            })}
          />
        </Field>
        <Field id="birthDate" label="Data de nascimento" error={form.formState.errors.birthDate?.message}>
          <input id="birthDate" type="date" className={inputClassName} {...form.register('birthDate')} />
        </Field>
        <Field id="phone" label="Telefone (opcional)">
          <input
            id="phone"
            type="tel"
            className={inputClassName}
            autoComplete="tel"
            {...form.register('phone', {
              onChange: (event) => {
                event.target.value = formatPhoneInput(event.target.value)
              },
            })}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando conta…' : 'Cadastrar'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-teal-800 hover:underline">
          Entrar
        </Link>
      </p>
    </Card>
  )
}
