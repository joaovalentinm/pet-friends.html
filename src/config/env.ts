import { z } from 'zod';

const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error('Configuração ausente: copie .env.example para .env (veja docs/PUBLICACAO.md).');
}

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseKey: parsed.data.VITE_SUPABASE_PUBLISHABLE_KEY,
};
