import { Link, useNavigate } from 'react-router-dom';

import { InstallBanner } from '@/components/InstallSheet';
import { Page, TopBar } from '@/components/Layout';
import { Button, Card, EmptyState, Hero } from '@/components/ui';
import { CareFeed, PetCareBlock, QuickCare } from '@/features/care/components';
import { useRoutines, useTodayLogs } from '@/features/care/hooks';
import { slotsFor } from '@/features/care/logic';
import { daysUntil, DueItem } from '@/features/health/components';
import { useDueRecords } from '@/features/health/hooks';
import { isPending } from '@/features/health/services';
import { usePets } from '@/features/pets/hooks';
import { t } from '@/i18n/strings';
import { useInstallUi } from '@/pwa/installUi';
import { firstName, useAuth } from '@/stores/auth';
import { greeting } from '@/utils/greeting';

export default function Home() {
  const navigate = useNavigate();
  const openInstall = () => useInstallUi.getState().setOpen(true);
  const name = firstName(useAuth((s) => s.session));
  const { data: pets, isLoading, isError, refetch } = usePets();
  const routines = useRoutines();
  const logs = useTodayLogs();
  const has = !!pets?.length;
  const { data: due } = useDueRecords();
  const soon = (due ?? []).filter((r) => isPending(r) && daysUntil(r.next_due_on ?? '') <= 14 && pets?.some((p) => p.id === r.pet_id)).slice(0, 3);

  const all = (pets ?? []).flatMap((p) => slotsFor(routines.data ?? [], logs.data ?? [], p.id));
  const done = all.filter((x) => x.log).length;
  const heroText = !has ? t.home.noPets : all.length ? (done === all.length ? t.home.allDone : t.home.remaining(all.length - done)) : t.home.withPets(pets.length);
  const careError = routines.isError || logs.isError;

  return (
    <>
      <TopBar />
      <Page>
        <InstallBanner onOpen={openInstall} />
        <Hero title={name ? `${greeting()}, ${name}!` : `${greeting()}!`} text={heroText}>
          {all.length ? (
            <div className="relative z-10 mt-3 inline-flex items-baseline gap-1 rounded-full bg-surface px-3 py-1 text-small text-textMuted shadow-card">
              <b className="text-title font-black text-heading">{done}/{all.length}</b> {t.home.doneToday}
            </div>
          ) : null}
        </Hero>
        {isLoading ? (
          <div className="h-[120px] animate-pulse rounded-xl bg-surfaceAlt" role="status" aria-label={t.auth.loading} />
        ) : isError ? (
          <Card className="text-center"><p className="mb-3 text-textMuted">{t.pets.loadError}</p><Button label={t.admin.retry} onClick={() => void refetch()} /></Card>
        ) : has ? (
          <>
            <QuickCare pets={pets} />
            {careError ? (
              <Card className="text-center">
                <p className="mb-3 text-textMuted">{t.care.loadError}</p>
                <Button label={t.admin.retry} onClick={() => { void routines.refetch(); void logs.refetch(); }} />
              </Card>
            ) : routines.isLoading || logs.isLoading ? (
              <div className="h-[120px] animate-pulse rounded-xl bg-surfaceAlt" role="status" aria-label={t.auth.loading} />
            ) : (
              pets.map((p) => <PetCareBlock key={p.id} pet={p} routines={routines.data ?? []} logs={logs.data ?? []} />)
            )}
          </>
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
        {has && !careError ? <CareFeed logs={logs.data ?? []} pets={pets} /> : null}
      </Page>
    </>
  );
}
