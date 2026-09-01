import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
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
      role: 'PACIENTE',
      fullName: '',
      email: '',
      password: '',
      cpf: '',
      birthDate: '',
      phone: '',
      crm: '',
      specialty: '',
    },
  })
  const role = useWatch({ control: form.control, name: 'role' })

  const mutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const payload =
        values.role === 'PACIENTE'
          ? {
              email: values.email,
              password: values.password,
              role: values.role,
              fullName: values.fullName,
              cpf: (values.cpf ?? '').replace(/\D/g, ''),
              birthDate: values.birthDate,
              phone: values.phone || undefined,
            }
          : {
              email: values.email,
              password: values.password,
              role: values.role,
              fullName: values.fullName,
              crm: values.crm?.trim(),
              specialty: values.specialty?.trim(),
            }
      const tokens = await register(payload)
      useAuthStore.setState({ token: tokens.token })
      const user = await fetchMe()
      setSession(tokens.token, user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
    onSuccess: () => navigate('/inicio', { replace: true }),
  })

  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-900">Criar conta</h1>
      <p className="mt-1 text-sm text-slate-600">Cadastre-se como paciente ou médico. Administradores não se cadastram por aqui.</p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        {mutation.isError ? <Alert variant="error">{errorMessage(mutation.error)}</Alert> : null}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-800">Tipo de conta</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['PACIENTE', 'MEDICO'] as const).map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"
              >
                <input type="radio" value={option} className="accent-teal-700" {...form.register('role')} />
                {option === 'PACIENTE' ? 'Paciente' : 'Médico'}
              </label>
            ))}
          </div>
        </fieldset>
        <Field id="fullName" label="Nome completo" error={form.formState.errors.fullName?.message}>
          <input id="fullName" className={inputClassName} autoComplete="name" {...form.register('fullName')} />
        </Field>
        <Field id="email" label="E-mail" error={form.formState.errors.email?.message}>
          <input id="email" type="email" className={inputClassName} autoComplete="email" {...form.register('email')} />
        </Field>
        <Field id="password" label="Senha" hint="Mínimo de 8 caracteres" error={form.formState.errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        {role === 'PACIENTE' ? (
          <>
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
          </>
        ) : (
          <>
            <Field id="crm" label="CRM" error={form.formState.errors.crm?.message}>
              <input id="crm" className={inputClassName} {...form.register('crm')} />
            </Field>
            <Field id="specialty" label="Especialidade" error={form.formState.errors.specialty?.message}>
              <input id="specialty" className={inputClassName} {...form.register('specialty')} />
            </Field>
          </>
        )}
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
