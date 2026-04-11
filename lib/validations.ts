import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Введите корректный email'),
  // LOW-1: raised from 6 to 8 characters (NIST SP 800-63B minimum)
  // LOW-NEW-3: max 128 chars — prevents bcrypt DoS (bcrypt truncates at 72 bytes anyway)
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(128, 'Пароль не должен превышать 128 символов'),
})

export const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  // LOW-1: raised from 6 to 8 characters; LOW-NEW-3: max 128 prevents bcrypt DoS
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(128, 'Пароль не должен превышать 128 символов'),
})

export type LoginInput    = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
