import { useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { t } from '@/i18n/strings';
import { markInstallAutoShown, shouldAutoShowInstall } from '@/pwa/install';
import { useInstallUi } from '@/pwa/installUi';
import { Icon, type IconName } from './Icon';
import { InstallSheet } from './InstallSheet';
import { Toaster } from './Toast';
import { IconButton } from './ui';

const logo = `${import.meta.env.BASE_URL}logo.png`;

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: t.tabs.home, icon: 'home' },
  { to: '/pets', label: t.tabs.pets, icon: 'paw' },
  { to: '/caderneta', label: t.tabs.booklet, icon: 'book' },
  { to: '/lembretes', label: t.tabs.reminders, icon: 'bell' },
  { to: '/locais', label: t.tabs.places, icon: 'pin' },
];

/** Moldura do app: coluna central (até 480px), barra de abas fixa e avisos. */
export function AppLayout() {
  const { open, setOpen } = useInstallUi();
  // Logo depois do login, explica como instalar (uma vez por aparelho).
  useEffect(() => {
    if (!shouldAutoShowInstall()) return;
    const id = setTimeout(() => {
      markInstallAutoShown();
      setOpen(true);
    }, 900);
    return () => clearTimeout(id);
  }, [setOpen]);
  return (
    <div className="mx-auto min-h-screen max-w-app bg-background pb-[calc(84px+env(safe-area-inset-bottom))] min-[520px]:shadow-[0_0_0_1px_theme(colors.line)]">
      <Outlet />
      <nav
        aria-label="Navegação principal"
        className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-app -translate-x-1/2 border-t border-line bg-surface px-[6px] pb-[env(safe-area-inset-bottom)] pt-[6px]"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex min-h-[58px] flex-1 flex-col items-center gap-[2px] pb-2 pt-[6px] text-[11.5px] font-extrabold ${isActive ? 'text-primary' : 'text-textMuted'}`
            }
          >
            <Icon name={tab.icon} size={24} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
      <Toaster />
      <InstallSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/** Barra do topo: título (ou logo na tela Início) + botão do Perfil. */
export function TopBar({ title, right }: { title?: string; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
      {title ? (
        <h1 className="flex-1 text-h1 font-black text-heading">{title}</h1>
      ) : (
        <div className="flex-1">
          <img src={logo} alt={t.brand.name} className="h-10 w-auto" />
        </div>
      )}
      {right}
      <IconButton icon="user" label={t.common.profileButton} onClick={() => navigate('/perfil')} />
    </header>
  );
}

/** Conteúdo da tela, com o espaçamento do protótipo. */
export function Page({ children }: { children: ReactNode }) {
  return <main className="flex flex-col gap-[22px] px-screen pb-6 pt-1">{children}</main>;
}
