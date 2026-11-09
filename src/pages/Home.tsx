import { useState } from 'react';

import { InstallCard, InstallSheet } from '@/components/InstallSheet';
import { Page, TopBar } from '@/components/Layout';
import { EmptyState, Hero } from '@/components/ui';
import { t } from '@/i18n/strings';
import { isStandalone } from '@/pwa/install';
import { comingSoon } from '@/utils/comingSoon';
import { greeting } from '@/utils/greeting';
import { firstName, useAuth } from '@/stores/auth';

export default function Home() {
  const [install, setInstall] = useState(false);
  const name = firstName(useAuth((s) => s.session));
  return (
    <>
      <TopBar />
      <Page>
        <Hero title={name ? `${greeting()}, ${name}!` : `${greeting()}!`} text={t.home.noPets} />
        <EmptyState
          icon="paw"
          title={t.home.emptyTitle}
          text={t.home.emptyText}
          actionLabel={t.home.emptyButton}
          onAction={() => comingSoon('O cadastro de pets')}
        />
        {!isStandalone() ? <InstallCard onOpen={() => setInstall(true)} /> : null}
      </Page>
      <InstallSheet open={install} onClose={() => setInstall(false)} />
    </>
  );
}
