import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import { Badge } from '../../../components/Badge'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { appointmentStatusLabel, formatDateTime } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { fetchBootstrapToken, listManagedDoctors } from '../../auth/api'
import { fetchAdminInsights } from '../api'
import { DoctorEnabledButton } from '../components/DoctorEnabledButton'
import {
  ChartLegend,
  DonutChart,
  LineChart,
  StackedBarChart,
  statusChartColors,
} from '../components/InsightCharts'

function formatDayLabel(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

function formatPercent(rate: number) {
  return `${(rate * 100).toFixed(1).replace('.', ',')}%`
}

function weekVariation(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 'Sem movimento nas duas semanas' : 'Volume novo nesta semana'
  }
  const delta = Math.round(((current - previous) / previous) * 100)
  if (delta === 0) {
    return 'Estável em relação à semana anterior'
  }
  return `${delta > 0 ? '+' : ''}${delta}% vs. a semana anterior`
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  )
}

export function AdminDashboardPage() {
  const insightsQuery = useQuery({ queryKey: queryKeys.adminInsights, queryFn: fetchAdminInsights })
  const doctorsQuery = useQuery({ queryKey: queryKeys.adminDoctors, queryFn: listManagedDoctors })
  const bootstrapQuery = useQuery({ queryKey: queryKeys.adminBootstrapToken, queryFn: fetchBootstrapToken })

  const insights = insightsQuery.data
  const last14Days = useMemo(() => insights?.last30Days.slice(-14) ?? [], [insights])
  const dayLabels30 = useMemo(() => (insights?.last30Days ?? []).map((point) => formatDayLabel(point.date)), [insights])
  const dayLabels14 = useMemo(() => last14Days.map((point) => formatDayLabel(point.date)), [last14Days])

  const volumeSeries = useMemo(
    () => [
      {
        key: 'created',
        label: 'Novos agendamentos',
        color: statusChartColors.created,
        values: (insights?.last30Days ?? []).map((point) => point.created),
      },
      {
        key: 'occurring',
        label: 'Consultas no dia',
        color: statusChartColors.confirmed,
        values: (insights?.last30Days ?? []).map(
          (point) => point.scheduled + point.confirmed + point.inProgress + point.completed + point.cancelled,
        ),
      },
    ],
    [insights],
  )

  const statusSeries = useMemo(
    () => [
      {
        key: 'cancelled',
        label: appointmentStatusLabel('CANCELLED'),
        color: statusChartColors.cancelled,
        values: last14Days.map((point) => point.cancelled),
      },
      {
        key: 'scheduled',
        label: appointmentStatusLabel('SCHEDULED'),
        color: statusChartColors.scheduled,
        values: last14Days.map((point) => point.scheduled),
      },
      {
        key: 'confirmed',
        label: appointmentStatusLabel('CONFIRMED'),
        color: statusChartColors.confirmed,
        values: last14Days.map((point) => point.confirmed),
      },
      {
        key: 'inProgress',
        label: appointmentStatusLabel('IN_PROGRESS'),
        color: statusChartColors.inProgress,
        values: last14Days.map((point) => point.inProgress),
      },
      {
        key: 'completed',
        label: appointmentStatusLabel('COMPLETED'),
        color: statusChartColors.completed,
        values: last14Days.map((point) => point.completed),
      },
    ],
    [last14Days],
  )

  const donutSegments = useMemo(() => {
    if (!insights) {
      return []
    }
    const { appointments } = insights
    return [
      { label: appointmentStatusLabel('SCHEDULED'), value: appointments.scheduled, color: statusChartColors.scheduled },
      { label: appointmentStatusLabel('CONFIRMED'), value: appointments.confirmed, color: statusChartColors.confirmed },
      { label: appointmentStatusLabel('IN_PROGRESS'), value: appointments.inProgress, color: statusChartColors.inProgress },
      { label: appointmentStatusLabel('COMPLETED'), value: appointments.completed, color: statusChartColors.completed },
      { label: appointmentStatusLabel('CANCELLED'), value: appointments.cancelled, color: statusChartColors.cancelled },
    ]
  }, [insights])

  if (insightsQuery.isPending) {
    return <Spinner label="Carregando painel" />
  }
  if (insightsQuery.isError || !insights) {
    return <Alert variant="error">{errorMessage(insightsQuery.error)}</Alert>
  }

  const { census, appointments } = insights

  return (
    <div>
      <PageHeader
        title="Painel administrativo"
        description="Acompanhe a operação da clínica, a evolução das consultas e a equipe médica."
        actions={
          <Link to="/medicos">
            <Button size="sm">Convidar médico</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Pacientes" value={census.patients} />
        <Kpi
          label="Médicos ativos"
          value={census.doctorsActive}
          hint={census.doctorsInactive > 0 ? `${census.doctorsInactive} desativado(s)` : 'Nenhum desativado'}
        />
        <Kpi label="Convites pendentes" value={census.pendingInvites} hint={`${census.admins} administrador(es)`} />
        <Kpi
          label="Consultas no total"
          value={appointments.total}
          hint={`${appointments.today} hoje · ${appointments.upcoming} próximas`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Agendadas" value={appointments.scheduled} />
        <Kpi label="Confirmadas" value={appointments.confirmed} hint={`${appointments.inProgress} em andamento`} />
        <Kpi label="Canceladas" value={appointments.cancelled} hint={`Taxa ${formatPercent(appointments.cancellationRate)}`} />
        <Kpi
          label="Concluídas"
          value={appointments.completed}
          hint={weekVariation(appointments.last7Days, appointments.previous7Days)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">Evolução dos últimos 30 dias</h2>
          <p className="mt-1 text-sm text-slate-600">Novos agendamentos e consultas previstas para cada dia.</p>
          <div className="mt-4">
            <LineChart labels={dayLabels30} series={volumeSeries} />
            <ChartLegend series={volumeSeries} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Situação atual</h2>
          <p className="mt-1 text-sm text-slate-600">Distribuição de todas as consultas do sistema.</p>
          <div className="mt-4">
            <DonutChart segments={donutSegments} />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-base font-semibold text-slate-900">Status nos últimos 14 dias</h2>
        <p className="mt-1 text-sm text-slate-600">Volume por dia da consulta, empilhado por status.</p>
        <div className="mt-4">
          <StackedBarChart labels={dayLabels14} series={statusSeries} />
          <ChartLegend series={statusSeries} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Por especialidade</h2>
          {insights.bySpecialty.length === 0 ? (
            <EmptyState className="mt-4" title="Sem especialidades" description="Quando houver médicos cadastrados, o volume aparece aqui." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-medium">Especialidade</th>
                    <th className="pb-2 font-medium">Médicos</th>
                    <th className="pb-2 font-medium">Consultas</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.bySpecialty.map((row) => (
                    <tr key={row.specialty} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 font-medium text-slate-900">{row.specialty}</td>
                      <td className="py-2 text-slate-600">{row.doctors}</td>
                      <td className="py-2 text-slate-600">{row.appointments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">Sistema</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Fuso da clínica</dt>
              <dd className="font-medium text-slate-900">{insights.clinicTimeZone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Atualizado em</dt>
              <dd className="font-medium text-slate-900">{formatDateTime(insights.generatedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Administradores</dt>
              <dd className="font-medium text-slate-900">{census.admins}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Token para novo admin</dt>
              {bootstrapQuery.data ? (
                <dd className="mt-1 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
                  {bootstrapQuery.data.token}
                </dd>
              ) : (
                <dd className="mt-1 text-slate-500">Carregando…</dd>
              )}
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-8 flex items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Equipe médica</h2>
        <Link to="/medicos" className="text-sm font-medium text-teal-800 hover:underline">
          Gerenciar convites
        </Link>
      </div>
      {doctorsQuery.isPending ? <Spinner className="mt-3" label="Carregando médicos" /> : null}
      {doctorsQuery.isError ? <Alert variant="error" className="mt-3">{errorMessage(doctorsQuery.error)}</Alert> : null}
      {doctorsQuery.data?.length === 0 ? (
        <EmptyState
          className="mt-3"
          title="Nenhum médico cadastrado"
          description="Convide pelo nome e e-mail. O médico conclui o cadastro pelo link."
          action={
            <Link to="/medicos">
              <Button size="sm">Convidar médico</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-3 space-y-3">
          {doctorsQuery.data?.map((doctor) => (
            <Card key={doctor.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{doctor.fullName}</p>
                  <Badge tone={doctor.enabled ? 'success' : 'neutral'}>{doctor.enabled ? 'Ativo' : 'Desativado'}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {doctor.specialty} · CRM {doctor.crm}
                </p>
                {doctor.email ? <p className="mt-1 text-xs text-slate-500">{doctor.email}</p> : null}
              </div>
              <DoctorEnabledButton doctor={doctor} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
