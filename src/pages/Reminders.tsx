import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Page, TopBar } from '@/components/Layout';
import { Sheet } from '@/components/Sheet';
import { toast } from '@/components/Toast';
import { Button, Card, EmptyState, Segmented } from '@/components/ui';
import { HEALTH } from '@/features/health/constants';
import { daysUntil, DueItem, relDays } from '@/features/health/components';
import { useDueRecords, useNextStatus } from '@/features/health/hooks';
import { isPending, type HealthRecord } from '@/features/health/services';
import { usePets } from '@/features/pets/hooks';
import { t } from '@/i18n/strings';
import { dateShort } from '@/utils/format';

type Seg = 'upcoming' | 'late' | 'done';

export default function Reminders() {
  const navigate = useNavigate();
  const [seg, setSeg] = useState<Seg>('upcoming');
  const [open, setOpen] = useState<HealthRecord | null>(null);
  const { data: due, isLoading, isError, refetch } = useDueRecords();
  const { data: pets } = usePets();
  const status = useNextStatus();
  const petName = (id: string) => pets?.find((p) => p.id === id)?.name;
  const canEdit = (id: string) => pets?.find((p) => p.id === id)?.canEdit ?? false;

  const { upcoming, late, done } = useMemo(() => {
    const pending = (due ?? []).filter(isPending).filter((r) => petName(r.pet_id));
    return {
      upcoming: pending.filter((r) => daysUntil(r.next_due_on ?? '') >= 0),
      late: pending.filter((r) => daysUntil(r.next_due_on ?? '') < 0),
      done: (due ?? []).filter((r) => r.next_done_at || r.next_cancelled_at).sort((a, b) => (b.next_done_at ?? b.next_cancelled_at ?? '').localeCompare(a.next_done_at ?? a.next_cancelled_at ?? '')).slice(0, 30),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due, pets]);

  const segments = [
    { key: 'upcoming', label: `${t.reminders.segments.upcoming}${upcoming.length ? ` (${upcoming.length})` : ''}` },
    { key: 'late', label: `${t.reminders.segments.late}${late.length ? ` (${late.length})` : ''}` },
    { key: 'done', label: t.reminders.segments.done },
  ] as const;

  const list = seg === 'upcoming' ? upcoming : late;
  return (
    <>
      <TopBar title={t.reminders.title} />
      <Page>
        <Segmented label="Filtro de lembretes" options={segments} value={seg} onChange={setSeg} />
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-surfaceAlt" role="status" aria-label={t.auth.loading} />
        ) : isError ? (
          <Card className="text-center"><p className="mb-3 text-textMuted">{t.reminders.loadError}</p><Button label={t.admin.retry} onClick={() => void refetch()} /></Card>
        ) : seg === 'done' ? (
          done.length ? (
            <div className="flex flex-col gap-[10px]">
              {done.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg bg-surface p-3 shadow-card">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{HEALTH[r.type].label}: {r.title}</b>
                    <span className="text-[13.5px] text-textMuted">{petName(r.pet_id)} · {r.next_done_at ? t.reminders.doneOn : t.reminders.cancelledOn} {dateShort((r.next_done_at ?? r.next_cancelled_at ?? '').slice(0, 10))}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-textMuted">{t.reminders.doneEmpty}</p>
          )
        ) : list.length ? (
          <div className="flex flex-col gap-[10px]">{list.map((r) => <DueItem key={r.id} record={r} petName={petName(r.pet_id)} onOpen={() => setOpen(r)} />)}</div>
        ) : seg === 'late' ? (
          <EmptyState icon="check" title={t.reminders.lateEmptyTitle} text={t.reminders.lateEmptyText} />
        ) : (
          <EmptyState icon="bell" title={t.reminders.emptyTitle} text={t.reminders.emptyText} />
        )}
        <p className="text-tiny text-textMuted">{t.reminders.footnote}</p>
      </Page>

      <Sheet open={!!open} onClose={() => setOpen(null)} labelledBy="rem-title">
        {open ? (
          <>
            <h2 id="rem-title" className="mb-1 text-[21px] font-black text-heading">{HEALTH[open.type].label}: {open.title}</h2>
            <p className="mb-4 text-textMuted">{petName(open.pet_id)} · {dateShort(open.next_due_on)} ({relDays(open.next_due_on ?? '')})</p>
            {open.notes ? <p className="mb-4 rounded-lg bg-infoBg p-3 text-small font-semibold text-heading">{open.notes}</p> : null}
            {canEdit(open.pet_id) ? (
              <div className="flex flex-col gap-[10px]">
                <Button
                  label={t.reminders.doneRegister}
                  variant="primary"
                  icon="check"
                  block
                  onClick={() => {
                    const r = open;
                    setOpen(null);
                    navigate(`/pets/${r.pet_id}/saude/novo?tipo=${r.type}&nome=${encodeURIComponent(r.title)}&de=${r.id}`);
                  }}
                />
                <Button
                  label={t.reminders.cancel}
                  variant="danger"
                  block
                  onClick={async () => {
                    const r = open;
                    setOpen(null);
                    await status.mutateAsync({ record: r, status: 'cancelled' });
                    toast(t.reminders.cancelled);
                  }}
                />
              </div>
            ) : (
              <p className="text-small text-textMuted">{t.reminders.viewOnly}</p>
            )}
          </>
        ) : null}
      </Sheet>
    </>
  );
}
