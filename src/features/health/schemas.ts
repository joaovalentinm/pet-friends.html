import { z } from 'zod';

import { todayIso } from '@/utils/format';

const opt = (max: number, label: string) => z.string().trim().max(max, `${label}: no máximo ${max} caracteres.`).optional().or(z.literal(''));

export const recordSchema = z
  .object({
    type: z.enum(['vaccine', 'dewormer', 'flea_tick', 'medication', 'vet_visit', 'exam']),
    title: z.string().trim().min(1, 'Informe o nome.').max(60, 'Nome: no máximo 60 caracteres.'),
    occurredOn: z.string().min(1, 'Informe a data.'),
    nextDueOn: z.string().optional().or(z.literal('')),
    lot: opt(40, 'Lote'),
    applicationForm: z.enum(['Pipeta', 'Coleira', 'Comprimido', 'Spray']).optional().or(z.literal('')),
    vetName: opt(60, 'Veterinário'),
    crmv: opt(20, 'CRMV'),
    notes: opt(400, 'Observações'),
  })
  .refine((v) => !v.occurredOn || v.occurredOn <= todayIso(new Date(Date.now() + 864e5)), { path: ['occurredOn'], message: 'A data não pode ser no futuro.' })
  .refine((v) => !v.nextDueOn || v.nextDueOn > v.occurredOn, { path: ['nextDueOn'], message: 'A próxima dose precisa ser depois da data do registro.' });

export type RecordInput = z.infer<typeof recordSchema>;
