import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Page, TopBar } from '@/components/Layout';
import { Card, EmptyState } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { CORE_VACCINES, HEALTH, type HealthType } from '@/features/health/constants';
import { RecordRow } from '@/features/health/components';
import { useRecords } from '@/features/health/hooks';
import { isPending } from '@/features/health/services';
import { PetPhoto } from '@/features/pets/components/PetPhoto';
import { usePets } from '@/features/pets/hooks';
import { SEX_LABEL, SPECIES_LABEL } from '@/features/pets/services';
import { t } from '@/i18n/strings';
import { ageText, dateShort, kg, todayIso } from '@/utils/format';

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
  const { data: records } = useRecords(pet?.id);
  const byType = (type: HealthType) => (records ?? []).filter((r) => r.type === type);
  const today = todayIso();
  const vaccineStatus = pet
    ? CORE_VACCINES[pet.species].map((v) => {
        const r = byType('vaccine').find((x) => v.match.test(x.title));
        let text: string = t.booklet.notRegistered;
        let tone = 'warn';
        if (r && isPending(r) && r.next_due_on && r.next_due_on < today) text = `${t.booklet.lateSince} ${dateShort(r.next_due_on)}`;
        else if (r && isPending(r) && r.next_due_on) { text = `${t.booklet.okUntil} ${dateShort(r.next_due_on)}`; tone = 'done'; }
        else if (r) { text = `${t.booklet.appliedOn} ${dateShort(r.occurred_on)}`; tone = 'info'; }
        return { ...v, record: r, text, tone };
      })
    : [];
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
            <section>
              <h2 className="mb-[10px] text-title font-black text-heading">{t.booklet.section2}</h2>
              <Card>
                <ul className="flex flex-col gap-3">
                  {vaccineStatus.map((v) => (
                    <li key={v.label} className="flex items-center justify-between gap-2">
                      <span><b className="block">{v.label}</b><span className="text-tiny text-textMuted">{v.tag}</span></span>
                      {v.record || !pet.canEdit ? (
                        <span className={`max-w-[58%] rounded-full px-[10px] py-1 text-right text-tiny font-extrabold ${v.tone === 'done' ? 'bg-doneBg text-doneInk' : v.tone === 'info' ? 'bg-infoBg text-heading' : 'bg-warnBg text-warnInk'}`}>{v.text}</span>
                      ) : (
                        <Link to={`/pets/${pet.id}/saude/novo?tipo=vaccine&nome=${encodeURIComponent(v.suggestion)}`} className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-surfaceAlt px-3 text-small font-extrabold text-heading"><Icon name="plus" size={16} />{t.health.add}</Link>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-tiny text-textMuted">{t.booklet.vaccineNote}</p>
              </Card>
              <div className="mt-3 flex flex-col gap-[10px]">
                {byType('vaccine').map((r) => <RecordRow key={r.id} record={r} petId={pet.id} />)}
              </div>
            </section>
            <section>
              <h2 className="mb-[10px] text-title font-black text-heading">{t.booklet.section3}</h2>
              {(['dewormer', 'flea_tick', 'vet_visit', 'exam', 'medication'] as const).map((type) => (
                <div key={type} className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-black text-heading">{HEALTH[type].plural}</h3>
                    {pet.canEdit ? <Link to={`/pets/${pet.id}/saude/novo?tipo=${type}`} className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-surfaceAlt px-3 text-small font-extrabold text-heading"><Icon name="plus" size={16} />{t.health.add}</Link> : null}
                  </div>
                  {byType(type).length ? (
                    <div className="flex flex-col gap-[10px]">{byType(type).map((r) => <RecordRow key={r.id} record={r} petId={pet.id} />)}</div>
                  ) : (
                    <p className="text-small text-textMuted">{t.booklet.noneOf(HEALTH[type].plural.toLowerCase())}</p>
                  )}
                </div>
              ))}
            </section>
            <Card className="bg-surfaceAlt shadow-none">
              <p className="text-small text-textMuted">{t.booklet.pdfSoon}</p>
            </Card>
          </>
        )}
      </Page>
    </>
  );
}
