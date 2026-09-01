export type Role = 'PACIENTE' | 'MEDICO' | 'ADMIN'

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'

export type ConsentScope = 'DOCTOR' | 'APPOINTMENT'

export type TokenResponse = {
  token: string
  tokenType: string
}

export type MeResponse = {
  id: string
  email: string
  role: Role
  fullName: string | null
  cpf: string | null
  birthDate: string | null
  phone: string | null
  crm: string | null
  specialty: string | null
}

export type RegisterRequest = {
  email: string
  password: string
  role: Exclude<Role, 'ADMIN'>
  fullName: string
  cpf?: string
  birthDate?: string
  phone?: string
  crm?: string
  specialty?: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type DoctorResponse = {
  id: string
  fullName: string
  crm: string
  specialty: string
}

export type AppointmentResponse = {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  scheduledAt: string
  durationMinutes: number
  status: AppointmentStatus
}

export type CreateAppointmentRequest = {
  doctorId: string
  scheduledAt: string
  durationMinutes?: number
}

export type ConsentResponse = {
  id: string
  patientId: string
  doctorId: string
  scope: ConsentScope
  appointmentId: string | null
  version: number
  grantedAt: string
  expiresAt: string | null
  revokedAt: string | null
}

export type GrantConsentRequest = {
  doctorId: string
  scope: ConsentScope
  appointmentId?: string
  expiresAt?: string
}

export type ClinicalNoteResponse = {
  id: string
  patientId: string
  authorDoctorId: string
  authorName: string | null
  appointmentId: string
  content: string
  createdAt: string
}

export type CreateClinicalNoteRequest = {
  appointmentId: string
  content: string
}

export type PrescriptionItemResponse = {
  medication: string
  dosage: string
  instructions: string
}

export type PrescriptionResponse = {
  id: string
  patientId: string
  doctorId: string
  doctorName: string
  appointmentId: string
  issuedAt: string
  items: PrescriptionItemResponse[]
}

export type CreatePrescriptionRequest = {
  patientId: string
  appointmentId: string
  items: PrescriptionItemResponse[]
}

export type VideoTokenResponse = {
  roomName: string
  token: string
  url: string
}

export type BackendApiError = {
  timestamp?: string
  status: number
  error?: string
  message: string
  path?: string
  details?: string[]
}
