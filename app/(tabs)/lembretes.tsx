import { useState } from 'react';
import { Text } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { TopBar, TopBarButton } from '@/components/layout/TopBar';
import { EmptyState, Segmented } from '@/components/ui';
import { t } from '@/i18n/strings';
import { comingSoon } from '@/utils/comingSoon';

type Seg = 'upcoming' | 'late' | 'done';
const SEGMENTS = [
  { key: 'upcoming', label: t.reminders.segments.upcoming },
  { key: 'late', label: t.reminders.segments.late },
  { key: 'done', label: t.reminders.segments.done },
] as const;

export default function RemindersScreen() {
  const [seg, setSeg] = useState<Seg>('upcoming');
  const add = () => comingSoon('Os lembretes');
  return (
    <Screen top={<TopBar title={t.reminders.title} right={<TopBarButton icon="plus" label={t.reminders.add} onPress={add} />} />}>
      <Segmented label="Filtro de lembretes" options={SEGMENTS} value={seg} onChange={setSeg} />
      {seg === 'upcoming' ? (
        <EmptyState icon="bell" title={t.reminders.emptyTitle} text={t.reminders.emptyText} actionLabel="Criar lembrete" onAction={add} />
      ) : seg === 'late' ? (
        <EmptyState icon="check" title={t.reminders.lateEmptyTitle} text={t.reminders.lateEmptyText} />
      ) : (
        <Text className="font-regular text-body text-textMuted">{t.reminders.doneEmpty}</Text>
      )}
      <Text className="font-regular text-tiny text-textMuted">{t.reminders.footnote}</Text>
    </Screen>
  );
}
