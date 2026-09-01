export const queryKeys = {
  me: ['auth', 'me'] as const,
  doctors: ['doctors'] as const,
  appointments: ['appointments'] as const,
  appointment: (id: string) => ['appointments', id] as const,
  consents: ['consents'] as const,
  ehr: (patientId: string, appointmentId?: string) =>
    appointmentId ? (['ehr', patientId, appointmentId] as const) : (['ehr', patientId] as const),
  prescriptions: ['prescriptions'] as const,
}
