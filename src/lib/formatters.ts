import type { AppointmentStatus, ConsentScope, Role } from '../types/api'

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
