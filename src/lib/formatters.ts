import type { AppointmentStatus, ConsentScope, DayOfWeek, Role } from '../types/api'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
})

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) {
    return '—'
  }
  return dateTimeFormatter.format(new Date(iso))
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) {
    return '—'
  }
  return dateFormatter.format(new Date(`${iso}T00:00:00`))
}

export function appointmentStatusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Agendada',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
  }
  return labels[status]
}

export function consentScopeLabel(scope: ConsentScope) {
  return scope === 'DOCTOR' ? 'Por médico' : 'Por consulta'
}

export function roleLabel(role: Role) {
  const labels: Record<Role, string> = {
    PACIENTE: 'Paciente',
    MEDICO: 'Médico',
    ADMIN: 'Administrador',
  }
  return labels[role]
}

export function shortId(value: string) {
  return value.slice(0, 8)
}

export function formatRelativeTime(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now()
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  const absMinutes = Math.round(Math.abs(diffMs) / 60_000)
  if (absMinutes < 60) {
    return formatter.format(Math.round(diffMs / 60_000), 'minute')
  }
  if (absMinutes < 60 * 48) {
    return formatter.format(Math.round(diffMs / 3_600_000), 'hour')
  }
  return formatter.format(Math.round(diffMs / 86_400_000), 'day')
}

export function formatCpfInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function weekdayLabel(day: DayOfWeek) {
  const labels: Record<DayOfWeek, string> = {
    MONDAY: 'Segunda',
    TUESDAY: 'Terça',
    WEDNESDAY: 'Quarta',
    THURSDAY: 'Quinta',
    FRIDAY: 'Sexta',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  }
  return labels[day]
}

export function formatClock(time: string) {
  return time.slice(0, 5)
}

const clinicTimeOptions = { timeZone: 'America/Sao_Paulo' } as const

export function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    ...clinicTimeOptions,
  }).format(new Date(iso))
}

export function formatSlotDay(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    ...clinicTimeOptions,
  }).format(new Date(iso))
}

export function joinWindowLabel(
  joinOpensAt: string,
  joinClosesAt: string,
  canJoinNow: boolean,
  confirmed: boolean,
) {
  if (canJoinNow) {
    return 'A sala está aberta agora'
  }
  if (!confirmed) {
    return `A sala abre ${formatRelativeTime(joinOpensAt)}, depois da confirmação do médico`
  }
  if (Date.now() < new Date(joinOpensAt).getTime()) {
    return `A sala abre ${formatRelativeTime(joinOpensAt)}`
  }
  return `A janela encerrou ${formatRelativeTime(joinClosesAt)}`
}
