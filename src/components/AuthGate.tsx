import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { t } from '@/i18n/strings';
import { useAuth } from '@/stores/auth';

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-background" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="w-44" />
        <span className="text-small font-bold text-textMuted">{t.auth.loading}</span>
      </div>
    </div>
  );
}

/** Só deixa entrar quem está logado; senão, vai para a tela de login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session, recovery } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  if (recovery && location.pathname !== '/nova-senha') return <Navigate to="/nova-senha" replace />;
  return <>{children}</>;
}

/** Telas de login/cadastro: quem já está logado vai direto para o app. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { loading, session, recovery } = useAuth();
  if (loading) return <Splash />;
  if (session && recovery) return <Navigate to="/nova-senha" replace />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}
