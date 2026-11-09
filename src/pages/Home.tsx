import { Link, useNavigate } from 'react-router-dom';

import { InstallBanner } from '@/components/InstallSheet';
import { Page, TopBar } from '@/components/Layout';
import { EmptyState, Hero } from '@/components/ui';
import { daysUntil, DueItem } from '@/features/health/components';
import { useDueRecords } from '@/features/health/hooks';
import { isPending } from '@/features/health/services';
import { PetPhoto } from '@/features/pets/components/PetPhoto';
import { usePets } from '@/features/pets/hooks';
import { t } from '@/i18n/strings';
import { useInstallUi } from '@/pwa/installUi';
import { firstName, useAuth } from '@/stores/auth';
import { ageText, kg } from '@/utils/format';
import { greeting } from '@/utils/greeting';

export default function Home() {
  const navigate = useNavigate();
  const openInstall = () => useInstallUi.getState().setOpen(true);
  const name = firstName(useAuth((s) => s.session));
  const { data: pets, isLoading } = usePets();
  const has = !!pets?.length;
  const { data: due } = useDueRecords();
  const soon = (due ?? []).filter((r) => isPending(r) && daysUntil(r.next_due_on ?? '') <= 14 && pets?.some((p) => p.id === r.pet_id)).slice(0, 3);
  return (
    <>
      <TopBar />
      <Page>
        <InstallBanner onOpen={openInstall} />
        <Hero title={name ? `${greeting()}, ${name}!` : `${greeting()}!`} text={has ? (soon.length ? t.home.withSoon(soon.length) : t.home.withPets(pets.length)) : t.home.noPets} />
        {isLoading ? (
          <div className="h-[120px] animate-pulse rounded-xl bg-surfaceAlt" role="status" aria-label={t.auth.loading} />
        ) : has ? (
          <section>
            <h2 className="mb-[10px] text-title font-black text-heading">{t.home.myPets}</h2>
            <div className="flex flex-col gap-[10px]">
              {pets.map((p) => (
                <Link key={p.id} to={`/pets/${p.id}`} className="flex items-center gap-3 rounded-xl bg-surface p-[14px] shadow-card">
                  <PetPhoto path={p.photo_path} name={p.name} size={52} />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-title text-heading">{p.name}</b>
                    <span className="text-small text-textMuted">{[ageText(p.birth_date), kg(p.lastWeight)].filter(Boolean).join(' · ') || ' '}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState icon="paw" title={t.home.emptyTitle} text={t.home.emptyText} actionLabel={t.home.emptyButton} onAction={() => navigate('/pets/novo')} />
        )}
        {soon.length ? (
          <section>
            <div className="mb-[10px] flex items-center justify-between">
              <h2 className="text-title font-black text-heading">{t.home.healthSoon}</h2>
              <Link to="/lembretes" className="text-small font-extrabold text-primary">{t.home.seeAll}</Link>
            </div>
            <div className="flex flex-col gap-[10px]">
              {soon.map((r) => <DueItem key={r.id} record={r} petName={pets?.find((p) => p.id === r.pet_id)?.name} onOpen={() => navigate('/lembretes')} />)}
            </div>
          </section>
        ) : null}
      </Page>
    </>
  );
}
