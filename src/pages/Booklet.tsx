import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Page, TopBar } from '@/components/Layout';
import { Card, EmptyState } from '@/components/ui';
import { PetPhoto } from '@/features/pets/components/PetPhoto';
import { usePets } from '@/features/pets/hooks';
import { SEX_LABEL, SPECIES_LABEL } from '@/features/pets/services';
import { t } from '@/i18n/strings';
import { ageText, dateShort, kg } from '@/utils/format';

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-small font-bold text-textMuted">{label}</dt>
      <dd className={`text-small ${value ? 'font-extrabold' : 'text-textMuted'}`}>{value || t.petDetail.notInformed}</dd>
    </>
  );
}

export default function Booklet() {
  const navigate = useNavigate();
  const { data: pets, isLoading } = usePets();
  const [selected, setSelected] = useState<string | null>(null);
  const pet = pets?.find((p) => p.id === selected) ?? pets?.[0];
  return (
    <>
      <TopBar title={t.booklet.title} />
      <Page>
        {isLoading ? (
          <div className="h-[200px] animate-pulse rounded-xl bg-surfaceAlt" role="status" aria-label={t.auth.loading} />
        ) : !pet ? (
          <EmptyState icon="book" title={t.booklet.emptyTitle} text={t.booklet.emptyText} actionLabel={t.pets.add} onAction={() => navigate('/pets/novo')} />
        ) : (
          <>
            {pets && pets.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pets.map((p) => (
                  <button key={p.id} type="button" aria-pressed={p.id === pet.id} onClick={() => setSelected(p.id)} className={`min-h-[38px] shrink-0 rounded-full px-[14px] text-small font-extrabold ${p.id === pet.id ? 'bg-primary text-onPrimary' : 'bg-surface text-textMuted shadow-[inset_0_0_0_1.5px_theme(colors.line)]'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
            ) : null}
            <Card className="flex items-center gap-3">
              <PetPhoto path={pet.photo_path} name={pet.name} size={52} />
              <div className="min-w-0 flex-1">
                <b className="block text-[19px] text-heading">{pet.name}</b>
                <span className="text-tiny text-textMuted">{t.booklet.subtitle}</span>
              </div>
            </Card>
            <section>
              <h2 className="mb-[10px] text-title font-black text-heading">{t.booklet.section1}</h2>
              <Card>
                <dl className="grid grid-cols-[auto_1fr] gap-x-[14px] gap-y-[6px]">
                  <Row label={t.petDetail.species} value={SPECIES_LABEL[pet.species]} />
                  <Row label={t.petDetail.breed} value={pet.breed} />
                  <Row label={t.petDetail.sex} value={SEX_LABEL[pet.sex]} />
                  <Row label={t.petDetail.coat} value={pet.coat} />
                  <Row label={t.petDetail.birth} value={pet.birth_date ? `${dateShort(pet.birth_date)} (${ageText(pet.birth_date)})` : null} />
                  <Row label={t.petDetail.microchip} value={pet.microchip} />
                  <Row label={t.petDetail.weight} value={kg(pet.lastWeight)} />
                  <Row label={t.petDetail.allergies} value={pet.allergies} />
                  <Row label={t.petDetail.chronic} value={pet.chronic_conditions} />
                </dl>
                {pet.canEdit ? <Link to={`/pets/${pet.id}/editar`} className="mt-3 inline-block text-small font-extrabold text-primary">{t.petDetail.edit}</Link> : null}
              </Card>
            </section>
            <Card className="bg-surfaceAlt shadow-none">
              <p className="text-small text-textMuted">{t.booklet.comingNext}</p>
            </Card>
          </>
        )}
      </Page>
    </>
  );
}
