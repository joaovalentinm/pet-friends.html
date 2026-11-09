import { z } from 'zod';

const email = z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Confira o e-mail: parece incompleto.'));

/** Senha criada só para o app: 8+ caracteres, com letras e números. */
export const passwordRule = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')
  .regex(/[A-Za-zÀ-ÿ]/, 'Use pelo menos uma letra.')
  .regex(/\d/, 'Use pelo menos um número.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe seu nome.').max(80, 'Nome muito longo.'),
  email,
  password: passwordRule,
  acceptTerms: z.literal(true, { error: 'Para criar a conta, aceite os Termos e a Política de Privacidade.' }),
});

export const forgotSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password: passwordRule, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'As senhas não são iguais.' });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
