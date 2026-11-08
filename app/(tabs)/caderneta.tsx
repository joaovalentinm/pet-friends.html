import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/ui';
import { t } from '@/i18n/strings';
import { comingSoon } from '@/utils/comingSoon';

export default function BookletScreen() {
  return (
    <Screen top={<TopBar title={t.booklet.title} />}>
      <EmptyState
        icon="book"
        title={t.booklet.emptyTitle}
        text={t.booklet.emptyText}
        actionLabel={t.pets.add}
        onAction={() => comingSoon('O cadastro de pets')}
      />
    </Screen>
  );
}
