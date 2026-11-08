import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { InstallCard, InstallSheet } from '@/components/InstallSheet';
import { Page } from '@/components/Layout';
import { Card, IconButton } from '@/components/ui';
import { t } from '@/i18n/strings';
import { isStandalone } from '@/pwa/install';

const logo = `${import.meta.env.BASE_URL}logo.png`;

export default function Profile() {
  const navigate = useNavigate();
  const [install, setInstall] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <IconButton icon="chevL" label={t.profile.back} onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-h1 font-black text-heading">{t.profile.title}</h1>
      </header>
      <Page>
        <Card>
          <p className="text-textMuted">{t.profile.soonText}</p>
        </Card>
        {!isStandalone() ? (
          <section>
            <h2 className="mb-[10px] text-title font-black text-heading">{t.install.section}</h2>
            <InstallCard onOpen={() => setInstall(true)} />
          </section>
        ) : null}
        <div className="flex flex-col items-center pt-6">
          <img src={logo} alt={t.brand.name} className="h-[68px] w-auto" />
          <p className="mt-2 text-small font-extrabold text-heading">{t.brand.slogan}</p>
        </div>
      </Page>
      <InstallSheet open={install} onClose={() => setInstall(false)} />
    </>
  );
}
