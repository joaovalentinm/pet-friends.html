import { Page, TopBar } from '@/components/Layout';
import { EmptyState } from '@/components/ui';
import { t } from '@/i18n/strings';
import { comingSoon } from '@/utils/comingSoon';

export default function Booklet() {
  return (
    <>
      <TopBar title={t.booklet.title} />
      <Page>
        <EmptyState
          icon="book"
          title={t.booklet.emptyTitle}
          text={t.booklet.emptyText}
          actionLabel={t.pets.add}
          onAction={() => comingSoon('O cadastro de pets')}
        />
      </Page>
    </>
  );
}
