import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Введите корректный email'),
  // LOW-1: raised from 6 to 8 characters (NIST SP 800-63B minimum)
  // LOW-NEW-3: max 128 chars — prevents bcrypt DoS (bcrypt truncates at 72 bytes anyway)
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(128, 'Пароль не должен превышать 128 символов'),
})

export const registerSchema = z.object({
  // LOW-3: added max() to prevent absurdly long inputs
  business_name: z.string()
    .min(2,   'Введите название вашего магазина')
    .max(200, 'Название магазина не должно превышать 200 символов'),

  contact_name: z.string()
    .min(2,   'Введите ваше имя')
    .max(100, 'Имя не должно превышать 100 символов'),

  // LOW-2: proper phone format validation (E.164-compatible, accepts Kazakh formats)
  phone: z.string()
    .regex(
      /^\+?[0-9\s\-()]{7,20}$/,
      'Введите корректный номер телефона (например: +7 777 123 45 67)'
    ),

  email: z.string().email('Введите корректный email'),

  // LOW-1: raised from 6 to 8 characters; LOW-NEW-3: max 128 prevents bcrypt DoS
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(128, 'Пароль не должен превышать 128 символов'),
})

export type LoginInput    = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
