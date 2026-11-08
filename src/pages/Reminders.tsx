import { useState } from 'react';

import { Page, TopBar } from '@/components/Layout';
import { EmptyState, IconButton, Segmented } from '@/components/ui';
import { t } from '@/i18n/strings';
import { comingSoon } from '@/utils/comingSoon';

type Seg = 'upcoming' | 'late' | 'done';
const SEGMENTS = [
  { key: 'upcoming', label: t.reminders.segments.upcoming },
  { key: 'late', label: t.reminders.segments.late },
  { key: 'done', label: t.reminders.segments.done },
] as const;

export default function Reminders() {
  const [seg, setSeg] = useState<Seg>('upcoming');
  const add = () => comingSoon('Os lembretes');
  return (
    <>
      <TopBar title={t.reminders.title} right={<IconButton icon="plus" label={t.reminders.add} onClick={add} />} />
      <Page>
        <Segmented label="Filtro de lembretes" options={SEGMENTS} value={seg} onChange={setSeg} />
        {seg === 'upcoming' ? (
          <EmptyState icon="bell" title={t.reminders.emptyTitle} text={t.reminders.emptyText} actionLabel="Criar lembrete" onAction={add} />
        ) : seg === 'late' ? (
          <EmptyState icon="check" title={t.reminders.lateEmptyTitle} text={t.reminders.lateEmptyText} />
        ) : (
          <p className="text-textMuted">{t.reminders.doneEmpty}</p>
        )}
        <p className="text-tiny text-textMuted">{t.reminders.footnote}</p>
      </Page>
    </>
  );
}
