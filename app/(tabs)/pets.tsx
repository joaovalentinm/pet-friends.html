import { Screen } from '@/components/layout/Screen';
import { TopBar, TopBarButton } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/ui';
import { t } from '@/i18n/strings';
import { comingSoon } from '@/utils/comingSoon';

export default function PetsScreen() {
  const add = () => comingSoon('O cadastro de pets');
  return (
    <Screen top={<TopBar title={t.pets.title} right={<TopBarButton icon="plus" label={t.pets.add} onPress={add} />} />}>
      <EmptyState icon="paw" title={t.pets.emptyTitle} text={t.pets.emptyText} actionLabel={t.pets.add} onAction={add} />
    </Screen>
  );
}
