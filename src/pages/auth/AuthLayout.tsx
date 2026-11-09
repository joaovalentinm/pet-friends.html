import type { ReactNode } from 'react';

import { Hills } from '@/components/ui';
import { t } from '@/i18n/strings';

const logo = `${import.meta.env.BASE_URL}logo.png`;

/** Moldura das telas de login/cadastro: logo, slogan, cartão e colinas da marca. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-app flex-col overflow-hidden bg-background">
      <div className="relative z-10 flex flex-1 flex-col px-6 pb-[150px] pt-[calc(28px+env(safe-area-inset-top))]">
        <img src={logo} alt={t.brand.name} className="mx-auto mb-1 mt-2 w-[min(70%,260px)]" />
        <p className="mb-6 text-center text-[17px] font-extrabold text-heading">{t.brand.slogan}</p>
        <div className="rounded-xl bg-surface p-5 shadow-card">
          <h1 className="mb-1 text-[24px] font-black leading-tight text-heading">{title}</h1>
          {subtitle ? <p className="mb-4 text-textMuted">{subtitle}</p> : <div className="mb-3" />}
          {children}
        </div>
      </div>
      <Hills height={130} />
    </div>
  );
}
