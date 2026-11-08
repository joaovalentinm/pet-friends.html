import { Page, TopBar } from '@/components/Layout';
import { EmptyState, IconButton } from '@/components/ui';
import { t } from '@/i18n/strings';
import { comingSoon } from '@/utils/comingSoon';

export default function Pets() {
  const add = () => comingSoon('O cadastro de pets');
  return (
    <>
      <TopBar title={t.pets.title} right={<IconButton icon="plus" label={t.pets.add} onClick={add} />} />
      <Page>
        <EmptyState icon="paw" title={t.pets.emptyTitle} text={t.pets.emptyText} actionLabel={t.pets.add} onAction={add} />
      </Page>
    </>
  );
}
