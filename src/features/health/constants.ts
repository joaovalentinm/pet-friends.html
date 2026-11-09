import type { IconName } from '@/components/Icon';
import type { Enums } from '@/types/database';

export type HealthType = Enums<'health_type'>;

export const HEALTH: Record<HealthType, { label: string; plural: string; icon: IconName; placeholder: string }> = {
  vaccine: { label: 'Vacina', plural: 'Vacinas', icon: 'syringe', placeholder: 'Ex.: V10, Antirrábica' },
  dewormer: { label: 'Vermífugo', plural: 'Vermífugos', icon: 'tablet', placeholder: 'Nome do vermífugo' },
  flea_tick: { label: 'Antipulgas', plural: 'Antipulgas', icon: 'bug', placeholder: 'Nome do produto' },
  medication: { label: 'Medicamento', plural: 'Medicamentos', icon: 'pill', placeholder: 'Nome e dose' },
  vet_visit: { label: 'Consulta', plural: 'Consultas', icon: 'steth', placeholder: 'Motivo da consulta' },
  exam: { label: 'Exame', plural: 'Exames', icon: 'clipboard', placeholder: 'Hemograma, raio-x...' },
};

export const HEALTH_TYPES = Object.keys(HEALTH) as HealthType[];

/** Tipos em que aparecem os campos de veterinário/CRMV. */
export const WITH_VET: HealthType[] = ['vaccine', 'vet_visit', 'exam'];
export const APPLICATION_FORMS = ['Pipeta', 'Coleira', 'Comprimido', 'Spray'] as const;

/** Sugestões de nome por tipo e espécie (toque rápido). */
export function suggestions(type: HealthType, species: 'dog' | 'cat'): string[] {
  if (type === 'vaccine') return species === 'cat' ? ['Antirrábica', 'Quádrupla (V4)', 'Quíntupla (V5)'] : ['Antirrábica', 'V10', 'V8', 'Gripe canina', 'Giárdia'];
  if (type === 'vet_visit') return ['Check-up', 'Retorno', 'Emergência'];
  if (type === 'exam') return ['Hemograma', 'Bioquímico', 'Raio-x', 'Ultrassom'];
  return [];
}

/** Vacinas essenciais por espécie (para o controle de vacinas da Caderneta). */
export const CORE_VACCINES: Record<'dog' | 'cat', { label: string; tag: string; suggestion: string; match: RegExp }[]> = {
  dog: [
    { label: 'Antirrábica', tag: 'Obrigatória', suggestion: 'Antirrábica', match: /r[aá]bica|raiva/i },
    { label: 'V8 ou V10', tag: 'Essencial', suggestion: 'V10', match: /\bv ?(8|10)\b|polivalente|m[uú]ltipla|[oó]ctupla|d[eé]ctupla/i },
  ],
  cat: [
    { label: 'Antirrábica', tag: 'Obrigatória', suggestion: 'Antirrábica', match: /r[aá]bica|raiva/i },
    { label: 'Quádrupla ou Quíntupla (V4/V5)', tag: 'Essencial', suggestion: 'Quíntupla (V5)', match: /\bv ?(3|4|5)\b|tr[ií]plice|qu[aá]drupla|qu[ií]ntupla/i },
  ],
};
