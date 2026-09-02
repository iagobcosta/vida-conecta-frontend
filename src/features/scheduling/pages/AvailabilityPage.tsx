import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { EmptyState } from '../../../components/EmptyState'
import { Field, inputClassName } from '../../../components/Field'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { formatClock, weekdayLabel } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useToastStore } from '../../../stores/toastStore'
import { createAvailability, deleteAvailability, listMyAvailability } from '../api'
import type { DayOfWeek } from '../../../types/api'

const WEEKDAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export function AvailabilityPage() {
  const queryClient = useQueryClient()
  const pushToast = useToastStore((state) => state.push)
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('12:00')
  const [slotMinutes, setSlotMinutes] = useState(30)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: queryKeys.myAvailability,
    queryFn: listMyAvailability,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createAvailability({
        dayOfWeek,
        startTime,
        endTime,
        slotMinutes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myAvailability })
      pushToast('Horário publicado na sua agenda.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAvailability,
    onSuccess: async () => {
      setDeleteId(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.myAvailability })
      pushToast('Horário removido.', 'info')
    },
  })

  return (
    <div>
      <PageHeader
        title="Meus horários"
        description="Cadastre os períodos em que você atende. Os pacientes só conseguem marcar consultas nesses horários."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Novo período</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              createMutation.mutate()
            }}
          >
            {createMutation.isError ? <Alert variant="error">{errorMessage(createMutation.error)}</Alert> : null}
            <Field id="dayOfWeek" label="Dia da semana">
              <select
                id="dayOfWeek"
                className={inputClassName}
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(event.target.value as DayOfWeek)}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {weekdayLabel(day)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="startTime" label="Início">
                <input
                  id="startTime"
                  type="time"
                  className={inputClassName}
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                />
              </Field>
              <Field id="endTime" label="Fim">
                <input
                  id="endTime"
                  type="time"
                  className={inputClassName}
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                />
              </Field>
            </div>
            <Field id="slotMinutes" label="Duração de cada consulta" hint="Os pacientes escolhem um destes encaixes.">
              <select
                id="slotMinutes"
                className={inputClassName}
                value={slotMinutes}
                onChange={(event) => setSlotMinutes(Number(event.target.value))}
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </Field>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando…' : 'Publicar horário'}
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Agenda publicada</h2>
          {listQuery.isPending ? <Spinner label="Carregando horários" /> : null}
          {listQuery.isError ? <Alert variant="error">{errorMessage(listQuery.error)}</Alert> : null}
          {listQuery.data?.length === 0 ? (
            <EmptyState
              title="Nenhum horário cadastrado"
              description="Enquanto a agenda estiver vazia, os pacientes não conseguem marcar consulta com você."
            />
          ) : (
            <div className="space-y-3">
              {listQuery.data?.map((item) => (
                <Card key={item.id}>
                  <p className="font-medium text-slate-900">{weekdayLabel(item.dayOfWeek)}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatClock(item.startTime)} às {formatClock(item.endTime)} · consultas de {item.slotMinutes} min
                  </p>
                  <Button className="mt-3" size="sm" variant="danger" onClick={() => setDeleteId(item.id)}>
                    Remover
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Remover este horário?"
        description="Consultas já marcadas permanecem. Novos pacientes deixam de ver esses encaixes."
        confirmLabel="Remover"
        danger
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId)
          }
        }}
      />
    </div>
  )
}
