import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Field, inputClassName } from '../../../components/Field'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { queryKeys } from '../../../services/queryKeys'
import { createAppointment, listDoctors } from '../api'

const schema = z.object({
  doctorId: z.string().min(1, 'Escolha um médico'),
  scheduledAt: z.string().min(1, 'Informe data e horário'),
  durationMinutes: z.number().min(15).max(120),
})

type FormValues = z.infer<typeof schema>

function minDateTimeLocal() {
  const date = new Date(Date.now() + 5 * 60_000)
  date.setSeconds(0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function NewAppointmentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const doctorsQuery = useQuery({ queryKey: queryKeys.doctors, queryFn: listDoctors })
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { doctorId: '', scheduledAt: minDateTimeLocal(), durationMinutes: 30 },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createAppointment({
        doctorId: values.doctorId,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        durationMinutes: values.durationMinutes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
      navigate('/agenda')
    },
  })

  return (
    <div>
      <PageHeader
        title="Nova consulta"
        description="Escolha o médico e um horário futuro. A consulta começa como agendada até o médico confirmar."
        actions={
          <Link to="/agenda">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />
      <Card className="max-w-xl">
        {doctorsQuery.isPending ? <Spinner label="Carregando médicos" /> : null}
        {doctorsQuery.isError ? <Alert variant="error">{errorMessage(doctorsQuery.error)}</Alert> : null}
        {doctorsQuery.data ? (
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
            {mutation.isError ? <Alert variant="error">{errorMessage(mutation.error)}</Alert> : null}
            <Field id="doctorId" label="Médico" error={form.formState.errors.doctorId?.message}>
              <select id="doctorId" className={inputClassName} {...form.register('doctorId')}>
                <option value="">Selecione</option>
                {doctorsQuery.data.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName} · {doctor.specialty} · CRM {doctor.crm}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="scheduledAt"
              label="Data e horário"
              hint="O horário precisa ser no futuro."
              error={form.formState.errors.scheduledAt?.message}
            >
              <input
                id="scheduledAt"
                type="datetime-local"
                min={minDateTimeLocal()}
                className={inputClassName}
                {...form.register('scheduledAt')}
              />
            </Field>
            <Field id="durationMinutes" label="Duração" error={form.formState.errors.durationMinutes?.message}>
              <select id="durationMinutes" className={inputClassName} {...form.register('durationMinutes', { valueAsNumber: true })}>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </Field>
            <Button type="submit" disabled={mutation.isPending || doctorsQuery.data.length === 0}>
              {mutation.isPending ? 'Agendando…' : 'Confirmar agendamento'}
            </Button>
            {doctorsQuery.data.length === 0 ? (
              <Alert variant="warning">Ainda não há médicos cadastrados. Peça a um médico para criar conta.</Alert>
            ) : null}
          </form>
        ) : null}
      </Card>
    </div>
  )
}
