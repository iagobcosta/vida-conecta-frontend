import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    role: z.enum(['PACIENTE', 'MEDICO']),
    fullName: z.string().trim().min(3, 'Informe o nome completo'),
    email: z.email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    cpf: z.string().optional(),
    birthDate: z.string().optional(),
    phone: z.string().optional(),
    crm: z.string().optional(),
    specialty: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.role === 'PACIENTE') {
      const digits = (values.cpf ?? '').replace(/\D/g, '')
      if (digits.length !== 11) {
        ctx.addIssue({ code: 'custom', path: ['cpf'], message: 'CPF deve ter 11 dígitos' })
      }
      if (!values.birthDate) {
        ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'Informe a data de nascimento' })
      }
    }
    if (values.role === 'MEDICO') {
      if (!values.crm?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['crm'], message: 'Informe o CRM' })
      }
      if (!values.specialty?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['specialty'], message: 'Informe a especialidade' })
      }
    }
  })

export type RegisterFormValues = z.infer<typeof registerSchema>
