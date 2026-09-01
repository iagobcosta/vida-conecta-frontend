import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { Field, inputClassName } from '../../../components/Field'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { cn } from '../../../lib/cn'
import { errorMessage } from '../../../lib/errors'
import { formatClock, formatDateTime, formatSlotDay, formatSlotTime, weekdayLabel } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useToastStore } from '../../../stores/toastStore'
import {
  createAppointment,
  listDoctorAvailability,
  listDoctorSlots,
  listDoctors,
} from '../api'
import type { AvailableSlotResponse, DoctorResponse } from '../../../types/api'

function groupSlots(slots: AvailableSlotResponse[]) {
  const groups = new Map<string, AvailableSlotResponse[]>()
  for (const slot of slots) {
    const key = formatSlotDay(slot.startAt)
    const current = groups.get(key) ?? []
    current.push(slot)
    groups.set(key, current)
  }
  return [...groups.entries()]
}

export function NewAppointmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preferredDoctorId = searchParams.get('medico')
  const queryClient = useQueryClient()
  const pushToast = useToastStore((state) => state.push)
  const [search, setSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResponse | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null)

  const doctorsQuery = useQuery({ queryKey: queryKeys.doctors, queryFn: listDoctors })

  useEffect(() => {
    if (!preferredDoctorId || selectedDoctor || !doctorsQuery.data) {
      return
    }
    const found = doctorsQuery.data.find((doctor) => doctor.id === preferredDoctorId)
    if (found) {
      setSelectedDoctor(found)
    }
  }, [preferredDoctorId, doctorsQuery.data, selectedDoctor])
  const availabilityQuery = useQuery({
    queryKey: queryKeys.doctorAvailability(selectedDoctor?.id ?? ''),
    queryFn: () => listDoctorAvailability(selectedDoctor?.id as string),
    enabled: Boolean(selectedDoctor),
  })
  const slotsQuery = useQuery({
    queryKey: queryKeys.doctorSlots(selectedDoctor?.id ?? ''),
    queryFn: () => listDoctorSlots(selectedDoctor?.id as string),
    enabled: Boolean(selectedDoctor),
  })

  const filteredDoctors = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (doctorsQuery.data ?? []).filter((doctor) => {
      if (!term) {
        return true
      }
      return `${doctor.fullName} ${doctor.specialty} ${doctor.crm}`.toLowerCase().includes(term)
    })
  }, [doctorsQuery.data, search])

  const mutation = useMutation({
    mutationFn: () =>
      createAppointment({
        doctorId: selectedDoctor?.id as string,
        scheduledAt: selectedSlot?.startAt as string,
        durationMinutes: selectedSlot?.durationMinutes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
      await queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
      pushToast('Consulta agendada. Aguarde a confirmação do médico.')
      navigate('/agenda')
    },
  })

  function chooseDoctor(doctor: DoctorResponse) {
    setSelectedDoctor(doctor)
    setSelectedSlot(null)
  }

  return (
    <div>
      <PageHeader
        title="Nova consulta"
        description="Escolha o médico e um horário livre da agenda dele. A consulta fica pendente até o médico confirmar."
        actions={
          <Link to="/agenda">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />

      {doctorsQuery.isPending ? <Spinner label="Carregando médicos" /> : null}
      {doctorsQuery.isError ? <Alert variant="error">{errorMessage(doctorsQuery.error)}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">1. Médico</h2>
          <Field id="doctorSearch" label="Buscar" className="mt-4">
            <input
              id="doctorSearch"
              className={inputClassName}
              placeholder="Nome, especialidade ou CRM"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          {doctorsQuery.data?.length === 0 ? (
            <Alert variant="warning" className="mt-4">
              Ainda não há médicos cadastrados.
            </Alert>
          ) : null}
          {filteredDoctors.length === 0 && (doctorsQuery.data?.length ?? 0) > 0 ? (
            <p className="mt-4 text-sm text-slate-600">Nenhum médico encontrado para “{search}”.</p>
          ) : null}
          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
            {filteredDoctors.map((doctor) => {
              const active = selectedDoctor?.id === doctor.id
              return (
                <li key={doctor.id}>
                  <button
                    type="button"
                    onClick={() => chooseDoctor(doctor)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                      active
                        ? 'border-teal-700 bg-teal-50'
                        : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50',
                    )}
                  >
                    <p className="font-medium text-slate-900">{doctor.fullName}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {doctor.specialty} · CRM {doctor.crm}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">2. Horário disponível</h2>
          {!selectedDoctor ? (
            <EmptyState className="mt-4" title="Selecione um médico à esquerda" description="A agenda livre aparece aqui." />
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Agenda de <strong>{selectedDoctor.fullName}</strong>
                {availabilityQuery.data && availabilityQuery.data.length > 0
                  ? `. Atende ${availabilityQuery.data
                      .map((item) => `${weekdayLabel(item.dayOfWeek)} ${formatClock(item.startTime)}–${formatClock(item.endTime)}`)
                      .join(', ')}.`
                  : '.'}
              </p>
              {availabilityQuery.isPending || slotsQuery.isPending ? (
                <Spinner className="mt-6" label="Carregando agenda" />
              ) : null}
              {slotsQuery.isError ? <Alert variant="error" className="mt-4">{errorMessage(slotsQuery.error)}</Alert> : null}
              {slotsQuery.data?.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  title={
                    availabilityQuery.data?.length === 0
                      ? 'Este médico ainda não publicou a agenda'
                      : 'Sem horários livres nos próximos 14 dias'
                  }
                  description={
                    availabilityQuery.data?.length === 0
                      ? 'Peça ao médico para cadastrar os períodos de atendimento em Meus horários.'
                      : 'Todos os encaixes desta agenda já foram ocupados. Tente outro médico ou volte mais tarde.'
                  }
                />
              ) : null}
              <div className="mt-4 space-y-5">
                {groupSlots(slotsQuery.data ?? []).map(([day, slots]) => (
                  <section key={day}>
                    <h3 className="text-sm font-medium capitalize text-slate-700">{day}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {slots.map((slot) => {
                        const active = selectedSlot?.startAt === slot.startAt
                        return (
                          <button
                            key={slot.startAt}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm',
                              active
                                ? 'border-teal-700 bg-teal-700 text-white'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-teal-400',
                            )}
                          >
                            {formatSlotTime(slot.startAt)}
                            <span className={cn('ml-1 text-xs', active ? 'text-teal-100' : 'text-slate-500')}>
                              {slot.durationMinutes} min
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
              {selectedSlot ? (
                <p className="mt-4 text-sm text-slate-700">
                  Selecionado: {formatDateTime(selectedSlot.startAt)} · {selectedSlot.durationMinutes} minutos
                </p>
              ) : null}
              {mutation.isError ? <Alert variant="error" className="mt-4">{errorMessage(mutation.error)}</Alert> : null}
              <Button
                className="mt-5"
                disabled={!selectedSlot || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Agendando…' : 'Confirmar agendamento'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
