import { InstallBanner } from '@/components/InstallSheet';
import { Page, TopBar } from '@/components/Layout';
import { EmptyState, Hero } from '@/components/ui';
import { t } from '@/i18n/strings';
import { useInstallUi } from '@/pwa/installUi';
import { comingSoon } from '@/utils/comingSoon';
import { greeting } from '@/utils/greeting';
import { firstName, useAuth } from '@/stores/auth';

export default function Home() {
  const openInstall = () => useInstallUi.getState().setOpen(true);
  const name = firstName(useAuth((s) => s.session));
  return (
    <>
      <TopBar />
      <Page>
        <InstallBanner onOpen={openInstall} />
        <Hero title={name ? `${greeting()}, ${name}!` : `${greeting()}!`} text={t.home.noPets} />
        <EmptyState
          icon="paw"
          title={t.home.emptyTitle}
          text={t.home.emptyText}
          actionLabel={t.home.emptyButton}
          onAction={() => comingSoon('O cadastro de pets')}
        />
      </Page>
    </>
  );
}
