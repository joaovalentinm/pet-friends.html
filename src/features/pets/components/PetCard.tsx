import { Link } from 'react-router-dom';

import { Icon } from '@/components/Icon';
import { RoleTag } from '@/components/ui';
import { ageText, kg } from '@/utils/format';
import { SEX_LABEL, SPECIES_LABEL, type PetWithWeight } from '../services';
import { PetPhoto } from './PetPhoto';

/** Cartão do pet (lista e Início), no estilo do protótipo. */
export function PetCard({ pet }: { pet: PetWithWeight }) {
  const line1 = [SPECIES_LABEL[pet.species], SEX_LABEL[pet.sex]].filter(Boolean).join(' · ');
  const line2 = [pet.breed, ageText(pet.birth_date)].filter(Boolean).join(' · ');
  return (
    <Link to={`/pets/${pet.id}`} className="block rounded-[24px] bg-surface p-4 shadow-card active:scale-[.985]" aria-label={`Abrir ${pet.name}`}>
      <span className="flex items-center gap-[14px]">
        <PetPhoto path={pet.photo_path} name={pet.name} size={76} ring />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-[6px] text-[21px] font-black leading-tight text-heading">
            <span className="truncate">{pet.name}</span>
            <span className="text-accent"><Icon name="heart" size={18} /></span>
          </span>
          <span className="mt-[3px] block text-small font-semibold text-textMuted">{line1}<RoleTag role={pet.myRole} /></span>
          <span className="block text-small font-semibold text-textMuted">{line2 || ' '}</span>
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-surfaceAlt text-heading" aria-hidden="true"><Icon name="chevR" size={18} /></span>
      </span>
      <span className="mt-[14px] grid grid-cols-3 gap-2">
        <Stat value={kg(pet.lastWeight) || '—'} label="Peso" />
        <Stat value={ageText(pet.birth_date) || '—'} label="Idade" />
        <Stat value={pet.allergies ? 'Sim' : '—'} label="Alergias" warn={!!pet.allergies} />
      </span>
    </Link>
  );
}

function Stat({ value, label, warn }: { value: string; label: string; warn?: boolean }) {
  return (
    <span className="min-w-0 rounded-[14px] bg-surfaceAlt px-[6px] py-[9px] text-center">
      <b className={`block truncate text-[14.5px] font-black ${warn ? 'text-warnInk' : 'text-heading'}`}>{value}</b>
      <i className="text-[11.5px] font-bold not-italic text-textMuted">{label}</i>
    </span>
  );
}
