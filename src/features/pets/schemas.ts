import { z } from 'zod';

import { parseDecimal, todayIso } from '@/utils/format';

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label}: no máximo ${max} caracteres.`).optional().or(z.literal(''));

/** Formulário de cadastro/edição do pet. */
export const petSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do pet.').max(30, 'Nome: no máximo 30 caracteres.'),
  species: z.enum(['dog', 'cat'], { error: 'Escolha cão ou gato.' }),
  sex: z.enum(['male', 'female', 'unknown']),
  breed: optionalText(40, 'Raça'),
  coat: optionalText(40, 'Pelagem'),
  birthDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || v <= todayIso(), 'A data de nascimento não pode ser no futuro.'),
  weight: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => {
      const n = parseDecimal(v);
      return n === null || (!Number.isNaN(n) && n > 0 && n < 200);
    }, 'Informe um peso válido em kg (ex.: 12,4).'),
  microchip: optionalText(30, 'Microchip'),
  chipSite: optionalText(40, 'Local do chip'),
  allergies: optionalText(150, 'Alergias'),
  chronicConditions: optionalText(150, 'Doenças crônicas'),
  notes: optionalText(300, 'Observações'),
});

export type PetInput = z.infer<typeof petSchema>;
