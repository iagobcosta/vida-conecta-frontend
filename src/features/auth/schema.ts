import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe o nome completo'),
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  cpf: z.string().refine((value) => value.replace(/\D/g, '').length === 11, 'CPF deve ter 11 dígitos'),
  birthDate: z.string().min(1, 'Informe a data de nascimento'),
  phone: z.string().optional(),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

export const adminRegisterSchema = z.object({
  token: z.string().uuid('Informe o token UUID de cadastro'),
  fullName: z.string().trim().min(3, 'Informe o nome completo'),
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>

export const completeDoctorSchema = z.object({
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  crm: z.string().trim().min(3, 'Informe o CRM'),
  specialty: z.string().trim().min(3, 'Informe a especialidade'),
})

export type CompleteDoctorFormValues = z.infer<typeof completeDoctorSchema>

export const inviteDoctorSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe o nome do médico'),
  email: z.email('E-mail inválido'),
})

export type InviteDoctorFormValues = z.infer<typeof inviteDoctorSchema>
