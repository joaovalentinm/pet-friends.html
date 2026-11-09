import { z } from 'zod';

const careType = z.enum(['feeding', 'water', 'walk', 'medication', 'bath', 'hygiene', 'custom']);

export const routineSchema = z.object({
  type: careType,
  title: z.string().trim().min(1, 'Informe o nome que aparece na lista.').max(40, 'Nome: no máximo 40 caracteres.'),
  times: z
    .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.'))
    .min(1, 'Adicione pelo menos um horário.')
    .max(12, 'No máximo 12 horários por rotina.'),
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Escolha pelo menos um dia.'),
  active: z.boolean(),
});
export type RoutineInput = z.infer<typeof routineSchema>;

export const quickLogSchema = z.object({
  petId: z.string().uuid('Escolha o pet.'),
  type: careType,
  notes: z.string().trim().max(120, 'Observação: no máximo 120 caracteres.'),
});
export type QuickLogInput = z.infer<typeof quickLogSchema>;
