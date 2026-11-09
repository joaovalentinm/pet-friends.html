import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { toast } from '@/components/Toast';
import { Button, Card, EmptyState, IconButton, RoleTag } from '@/components/ui';
import { PetPhoto } from '@/features/pets/components/PetPhoto';
import { useDeletePet, usePet, useWeights } from '@/features/pets/hooks';
import { SEX_LABEL, SPECIES_LABEL } from '@/features/pets/services';
import { t } from '@/i18n/strings';
import { ageText, dateShort, kg } from '@/utils/format';

const s = t.petDetail;

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-small font-bold text-textMuted">{label}</dt>
      <dd className={`text-small ${value ? 'font-extrabold text-text' : 'text-textMuted'}`}>{value || s.notInformed}</dd>
    </>
  );
}

/** Perfil do pet: foto, resumo, dados e histórico de peso. */
export default function PetDetail() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { pet, isLoading, isError, refetch } = usePet(petId);
  const { data: weights } = useWeights(petId);
  const remove = useDeletePet();
  const [confirm, setConfirm] = useState(false);

  const header = (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
      <IconButton icon="chevL" label={t.profile.back} onClick={() => navigate('/pets')} />
      <span className="flex-1" />
      {pet?.canEdit ? <IconButton icon="edit" label={s.edit} onClick={() => navigate(`/pets/${pet.id}/editar`)} /> : null}
    </header>
  );

  if (isLoading) return <div className="mx-auto min-h-screen max-w-app bg-background">{header}<p role="status" className="px-screen text-textMuted">{s.loading}</p></div>;
  if (isError)
    return (
      <div className="mx-auto min-h-screen max-w-app bg-background">
        {header}
        <div className="px-screen"><Card className="text-center"><p className="mb-3 text-textMuted">{s.error}</p><Button label={t.admin.retry} onClick={() => void refetch()} /></Card></div>
      </div>
    );
  if (!pet) return <div className="mx-auto min-h-screen max-w-app bg-background">{header}<div className="px-screen"><EmptyState icon="paw" title={s.notFound} text={s.notFoundText} /></div></div>;

  const sub = [SPECIES_LABEL[pet.species], SEX_LABEL[pet.sex], pet.breed, ageText(pet.birth_date)].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto min-h-screen max-w-app bg-background">
      {header}
      <main className="flex flex-col gap-4 px-screen pb-10">
        <div className="pb-1 pt-1 text-center">
          <div className="mx-auto w-fit"><PetPhoto path={pet.photo_path} name={pet.name} size={112} ring /></div>
          <h2 className="mt-3 flex items-center justify-center gap-2 text-[26px] font-black text-heading">
            {pet.name} <span className="text-accent"><Icon name="heart" size={22} /></span>
          </h2>
          <p className="text-small text-textMuted">{sub}</p>
          <p className="mt-1"><RoleTag role={pet.myRole} /></p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[[kg(pet.lastWeight) || '—', s.weight], [ageText(pet.birth_date) || '—', s.age], [pet.microchip ? s.yes : '—', s.chip]].map(([v, l]) => (
            <div key={l} className="rounded-lg bg-surface px-[10px] py-3 text-center shadow-card">
              <b className="block text-[15px] font-black text-heading">{v}</b>
              <span className="text-[12px] font-bold text-textMuted">{l}</span>
            </div>
          ))}
        </div>

        {pet.allergies || pet.chronic_conditions ? (
          <div role="note" className="flex gap-3 rounded-lg bg-warnBg p-[14px] font-bold text-warnInk">
            <span>
              {pet.allergies ? <>{s.allergies}: {pet.allergies}</> : null}
              {pet.allergies && pet.chronic_conditions ? <br /> : null}
              {pet.chronic_conditions ? <>{s.chronic}: {pet.chronic_conditions}</> : null}
            </span>
          </div>
        ) : null}

        <Card>
          <h3 className="mb-2 text-title font-black text-heading">{s.data}</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-[14px] gap-y-[6px]">
            <Row label={s.species} value={SPECIES_LABEL[pet.species]} />
            <Row label={s.sex} value={SEX_LABEL[pet.sex]} />
            <Row label={s.breed} value={pet.breed} />
            <Row label={s.coat} value={pet.coat} />
            <Row label={s.birth} value={pet.birth_date ? `${dateShort(pet.birth_date)} (${ageText(pet.birth_date)})` : null} />
            <Row label={s.microchip} value={pet.microchip} />
            <Row label={s.chipSite} value={pet.microchip ? pet.chip_site : null} />
            <Row label={s.notes} value={pet.notes} />
          </dl>
        </Card>

        <Card>
          <h3 className="mb-2 text-title font-black text-heading">{s.weightHistory}</h3>
          {weights && weights.length ? (
            <ul className="divide-y divide-line">
              {weights.slice(0, 10).map((w) => (
                <li key={w.id} className="flex justify-between py-2 text-small">
                  <span className="text-textMuted">{dateShort(w.measured_on)}</span>
                  <b className="text-heading">{kg(Number(w.weight_kg))}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small text-textMuted">{s.noWeights}</p>
          )}
        </Card>

        <Card className="bg-surfaceAlt shadow-none">
          <p className="text-small text-textMuted">{s.comingNext}</p>
        </Card>

        {pet.canEdit ? <Link to={`/pets/${pet.id}/editar`} className="flex min-h-[48px] items-center justify-center rounded-full bg-accent font-extrabold text-onAccent">{s.edit}</Link> : null}
        {pet.myRole === 'tutor' ? <Button label={s.delete(pet.name)} variant="danger" block onClick={() => setConfirm(true)} /> : null}
      </main>

      <Sheet open={confirm} onClose={() => setConfirm(false)} labelledBy="del-title">
        <h2 id="del-title" className="mb-2 text-[21px] font-black text-heading">{s.deleteTitle(pet.name)}</h2>
        <p className="mb-4 text-textMuted">{s.deleteText(pet.name)}</p>
        <div className="flex flex-col gap-[10px]">
          <Button
            label={remove.isPending ? s.deleting : s.deleteConfirm}
            variant="danger"
            block
            disabled={remove.isPending}
            onClick={async () => {
              try {
                await remove.mutateAsync(pet);
                toast(s.deleted);
                navigate('/pets', { replace: true });
              } catch {
                toast(s.deleteError);
              }
            }}
          />
          <Button label={s.back} variant="soft" block onClick={() => setConfirm(false)} />
        </div>
      </Sheet>
    </div>
  );
}
