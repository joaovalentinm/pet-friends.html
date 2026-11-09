import type { IconName } from '@/components/Icon';
import type { Enums } from '@/types/database';

export type CareType = Enums<'care_type'>;

/** Tipos de cuidado em casa (rótulo, ícone, verbo usado no histórico e nome sugerido na rotina). */
export const CARE: Record<CareType, { label: string; icon: IconName; verb: string; suggestion: string }> = {
  feeding: { label: 'Comida', icon: 'food', verb: 'deu comida', suggestion: 'Comida' },
  water: { label: 'Água', icon: 'drop', verb: 'trocou a água', suggestion: 'Trocar a água' },
  walk: { label: 'Passeio', icon: 'walk', verb: 'levou para passear', suggestion: 'Passeio' },
  medication: { label: 'Remédio', icon: 'pill', verb: 'deu o remédio', suggestion: 'Remédio' },
  bath: { label: 'Banho', icon: 'shower', verb: 'deu banho', suggestion: 'Banho' },
  hygiene: { label: 'Higiene', icon: 'hygiene', verb: 'cuidou da higiene', suggestion: 'Escovar os dentes' },
  custom: { label: 'Outro', icon: 'star', verb: 'registrou um cuidado', suggestion: '' },
};

export const CARE_TYPES = Object.keys(CARE) as CareType[];

/** 0 = domingo (igual ao Date.getDay()). */
export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

/** Depois de quantos minutos do horário o cuidado aparece como atrasado. */
export const LATE_AFTER_MINUTES = 30;
