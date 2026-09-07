import { describe, expect, it } from 'vitest'
import {
  appointmentStatusLabel,
  formatCpfInput,
  formatPhoneInput,
  roleLabel,
} from './formatters'

describe('formatCpfInput', () => {
  it('masks digits as ###.###.###-##', () => {
    expect(formatCpfInput('12345678900')).toBe('123.456.789-00')
  })

  it('ignores non-digit characters and truncates to 11 digits', () => {
    expect(formatCpfInput('123.456.789-00999')).toBe('123.456.789-00')
  })
})

describe('formatPhoneInput', () => {
  it('masks landline numbers as (##) ####-####', () => {
    expect(formatPhoneInput('1234567890')).toBe('(12) 3456-7890')
  })

  it('masks mobile numbers as (##) #####-####', () => {
    expect(formatPhoneInput('12345678901')).toBe('(12) 34567-8901')
  })
})

describe('roleLabel', () => {
  it('translates known roles to pt-BR labels', () => {
    expect(roleLabel('PACIENTE')).toBe('Paciente')
    expect(roleLabel('MEDICO')).toBe('Médico')
    expect(roleLabel('ADMIN')).toBe('Administrador')
  })
})

describe('appointmentStatusLabel', () => {
  it('translates known statuses to pt-BR labels', () => {
    expect(appointmentStatusLabel('CONFIRMED')).toBe('Confirmada')
    expect(appointmentStatusLabel('CANCELLED')).toBe('Cancelada')
  })
})
