import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { InstallCard, InstallSheet } from '@/components/InstallSheet';
import { Page } from '@/components/Layout';
import { toast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { Avatar, Button, Card, IconButton, RoleTag } from '@/components/ui';
import { isAdmin } from '@/features/admin/services';
import { signOut } from '@/features/auth/services';
import { t } from '@/i18n/strings';
import { isStandalone } from '@/pwa/install';
import { useInstallUi } from '@/pwa/installUi';
import { firstName, useAuth } from '@/stores/auth';

const logo = `${import.meta.env.BASE_URL}logo.png`;

export default function Profile() {
  const navigate = useNavigate();
  const session = useAuth((s) => s.session);
  const { open: install, setOpen: setInstall } = useInstallUi();
  const fullName = String(session?.user.user_metadata?.full_name ?? firstName(session));
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    void isAdmin().then(setAdmin);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <IconButton icon="chevL" label={t.profile.back} onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-h1 font-black text-heading">{t.profile.title}</h1>
      </header>
      <Page>
        <section>
          <h2 className="mb-[10px] text-title font-black text-heading">{t.profile.account}</h2>
          <Card className="flex items-center gap-3">
            <Avatar name={fullName} size={48} />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[17px] text-heading">{fullName}<RoleTag role="tutor" /></b>
              <span className="block truncate text-small text-textMuted">{session?.user.email}</span>
            </div>
          </Card>
        </section>
        {admin ? (
          <Link to="/painel" className="flex items-center gap-3 rounded-[20px] bg-heading px-4 py-[14px] text-white shadow-card">
            <span className="min-w-0 flex-1">
              <b className="block">{t.admin.open}</b>
              <span className="text-tiny opacity-90">{t.admin.openHint}</span>
            </span>
            <Icon name="chevR" size={20} />
          </Link>
        ) : null}
        <Card>
          <p className="text-textMuted">{t.profile.soonText}</p>
        </Card>
        {!isStandalone() ? (
          <section>
            <h2 className="mb-[10px] text-title font-black text-heading">{t.install.section}</h2>
            <InstallCard onOpen={() => setInstall(true)} />
          </section>
        ) : null}
        <div className="flex flex-col gap-3">
          <Link to="/privacidade" className="text-center text-small font-extrabold text-primary">{t.profile.privacy}</Link>
          <Button
            label={t.profile.signOut}
            variant="danger"
            block
            onClick={async () => {
              await signOut();
              toast(t.profile.signedOut);
            }}
          />
        </div>
        <div className="flex flex-col items-center pt-4">
          <img src={logo} alt={t.brand.name} className="h-[68px] w-auto" />
          <p className="mt-2 text-small font-extrabold text-heading">{t.brand.slogan}</p>
        </div>
      </Page>
      <InstallSheet open={install} onClose={() => setInstall(false)} />
    </>
  );
}
