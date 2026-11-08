import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { EmptyState, Hero } from '@/components/ui';
import { t } from '@/i18n/strings';
import { comingSoon } from '@/utils/comingSoon';
import { greeting } from '@/utils/greeting';

export default function HomeScreen() {
  return (
    <Screen top={<TopBar />}>
      <Hero title={`${greeting()}!`} text={t.home.noPets} />
      <EmptyState
        icon="paw"
        title={t.home.emptyTitle}
        text={t.home.emptyText}
        actionLabel={t.home.emptyButton}
        onAction={() => comingSoon('O cadastro de pets')}
      />
    </Screen>
  );
}
