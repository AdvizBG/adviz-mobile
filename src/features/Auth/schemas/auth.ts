import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Min 8 characters'),
    confirm_password: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
