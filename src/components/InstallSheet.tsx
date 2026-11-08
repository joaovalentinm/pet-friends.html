import type { ReactNode } from 'react';

import { t } from '@/i18n/strings';
import { detectPlatform, promptInstall, useInstallPrompt, type Platform } from '@/pwa/install';
import { Icon, type IconName } from './Icon';
import { Sheet } from './Sheet';
import { Button } from './ui';

const appIcon = `${import.meta.env.BASE_URL}icons/icon-192.png`;

function Key({ icon, label }: { icon?: IconName; label?: string }) {
  return (
    <span className="mx-[2px] inline-flex items-center gap-[6px] whitespace-nowrap rounded-[10px] bg-surface px-[10px] py-[2px] align-middle font-extrabold shadow-card">
      {icon ? <Icon name={icon} size={17} /> : null}
      {label}
    </span>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="overflow-hidden rounded-[20px] bg-surfaceAlt">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-[14px] border-line p-4 leading-[1.9] [&+&]:border-t">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-text text-[14px] font-black text-background">{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

const s = t.install;

function content(platform: Platform) {
  switch (platform) {
    case 'inapp':
      return {
        why: s.inAppWhy,
        steps: [
          <>Toque em <Key icon="dots" /> ou <Key icon="kebab" /> no canto da tela.</>,
          <>Escolha <Key icon="compass" label="Abrir no navegador" /> (Safari ou Chrome).</>,
          <>Lá, toque de novo em “Usar o app” e siga os passos.</>,
        ],
      };
    case 'ios':
      return {
        why: s.iosWhy,
        steps: [
          <>Toque em <Key icon="share" /> na barra do Safari.</>,
          <>Escolha <Key icon="plusSq" label="Adicionar à Tela de Início" />.</>,
          <>Toque em “Adicionar”. Pronto: o ícone aparece na tela de início.</>,
        ],
      };
    case 'android':
      return {
        why: s.androidWhy,
        steps: [
          <>Toque em <Key icon="kebab" /> no canto de cima do Chrome.</>,
          <>Escolha <Key icon="phoneDl" label="Instalar app" /> ou <Key icon="plusSq" label="Adicionar à tela inicial" />.</>,
          <>Confirme em “Instalar”. O ícone aparece na tela de início.</>,
        ],
      };
    default:
      return {
        why: s.desktopWhy,
        steps: [
          <>No navegador, toque no menu <Key icon="kebab" /> ou no ícone de instalar na barra de endereço.</>,
          <>Escolha <Key icon="phoneDl" label="Instalar Pet Friends" />.</>,
          <>Confirme. O app abre em uma janela própria.</>,
        ],
      };
  }
}

/** Folha "Instalar o app": instruções conforme o aparelho (referência aprovada pelo responsável). */
export function InstallSheet({ open, onClose, platform = detectPlatform() }: { open: boolean; onClose: () => void; platform?: Platform }) {
  const canPrompt = useInstallPrompt() !== null && platform !== 'inapp' && platform !== 'ios';
  const c = content(platform);
  return (
    <Sheet open={open} onClose={onClose} labelledBy="install-title">
      <div className="mb-4 flex items-center gap-[14px]">
        <img src={appIcon} alt="" className="h-14 w-14 shrink-0 rounded-[14px]" />
        <div className="min-w-0">
          <h2 id="install-title" className="text-[22px] font-black leading-tight text-heading">{s.title}</h2>
          <p className="mt-[2px] text-[15px] text-textMuted">{s.subtitle}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={s.close} className="ml-auto grid h-touch w-touch shrink-0 place-items-center rounded-full bg-surfaceAlt text-heading">
          <Icon name="x" />
        </button>
      </div>
      <p className="mb-4 text-[15px] text-textMuted">{c.why}</p>
      {canPrompt ? (
        <div className="mb-[14px]">
          <Button label={s.installNow} icon="phoneDl" block onClick={async () => { if (await promptInstall()) onClose(); }} />
          <p className="mt-2 text-center text-tiny text-textMuted">{s.fallback}</p>
        </div>
      ) : null}
      <Steps items={c.steps} />
    </Sheet>
  );
}

/** Cartão "Usar o app" que abre a folha de instalação. */
export function InstallCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-[20px] bg-surface px-[14px] py-3 text-left shadow-card">
      <img src={appIcon} alt="" className="h-10 w-10 shrink-0 rounded-[11px]" />
      <span className="min-w-0 flex-1">
        <b className="block text-heading">{s.cardTitle}</b>
        <span className="text-tiny text-textMuted">{s.cardText}</span>
      </span>
      <Icon name="chevR" size={20} className="text-textMuted" />
    </button>
  );
}
