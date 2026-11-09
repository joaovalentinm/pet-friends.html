import { useState, type ReactNode } from 'react';

import { t } from '@/i18n/strings';
import { detectPlatform, dismissBanner, isBannerDismissed, isStandalone, promptInstall, useInstallPrompt, useJustInstalled, type Platform } from '@/pwa/install';
import { Icon, type IconName } from './Icon';
import { Sheet } from './Sheet';
import { toast } from './Toast';
import { Button } from './ui';

const appIcon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
const s = t.install;

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

const finish = <>Pronto: o ícone do <b>Pet Friends</b> aparece na tela de início. Abra sempre por ele.</>;

/** Instruções para cada aparelho/navegador. */
function content(platform: Platform): { why: string; steps: ReactNode[]; note?: string } {
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
    case 'ios-safari':
      return {
        why: s.iosWhy,
        steps: [
          <>Toque em <Key icon="dots" /> ao lado da barra de endereço (no iPhone mais antigo, toque direto em <Key icon="share" />).</>,
          <>Toque em <Key icon="share" label="Compartilhar" />, depois em <b>Ver mais</b>, e escolha <Key icon="plusSq" label="Adicionar à Tela de Início" />.</>,
          <>Deixe <b>“Abrir como App Web”</b> ligado e toque em “Adicionar”. {finish}</>,
        ],
        note: s.iosNote,
      };
    case 'ios-chrome':
      return {
        why: s.iosWhy,
        steps: [
          <>Toque em <Key icon="share" /> no alto da tela, ao lado do endereço do site.</>,
          <>Role a lista e escolha <Key icon="plusSq" label="Adicionar à Tela de Início" />.</>,
          <>Toque em “Adicionar”. {finish}</>,
        ],
        note: s.iosNote,
      };
    case 'ios-other':
      return {
        why: s.iosOtherWhy,
        steps: [
          <>Toque em <Key icon="share" label="Compartilhar" /> no menu do navegador.</>,
          <>Escolha <Key icon="plusSq" label="Adicionar à Tela de Início" />. Se não houver essa opção, abra o site no Safari.</>,
          <>Toque em “Adicionar”. {finish}</>,
        ],
        note: s.iosNote,
      };
    case 'android-chrome':
      return {
        why: s.androidWhy,
        steps: [
          <>Toque em <Key icon="kebab" /> no canto de cima do Chrome.</>,
          <>Escolha <Key icon="phoneDl" label="Instalar app" /> ou <Key icon="plusSq" label="Adicionar à tela inicial" />.</>,
          <>Confirme em “Instalar”. {finish}</>,
        ],
      };
    case 'android-samsung':
      return {
        why: s.androidWhy,
        steps: [
          <>Toque no menu <Key label="☰" /> embaixo, à direita.</>,
          <>Escolha <Key icon="plusSq" label="Adicionar página a" /> e depois “Tela inicial”.</>,
          <>Confirme em “Adicionar”. {finish}</>,
        ],
      };
    case 'android-other':
      return {
        why: s.androidWhy,
        steps: [
          <>Abra o menu do navegador <Key icon="kebab" />.</>,
          <>Escolha <Key icon="phoneDl" label="Instalar" /> ou <Key icon="plusSq" label="Adicionar à tela inicial" />. Se não aparecer, abra o site no Chrome.</>,
          <>Confirme. {finish}</>,
        ],
      };
    default:
      return {
        why: s.desktopWhy,
        steps: [
          <>No celular, abra <b>petfriends.wearefield.io</b> no Chrome (Android) ou no Safari (iPhone).</>,
          <>Toque em “Usar o app” e siga os passos do seu aparelho.</>,
          <>No computador, você também pode usar o ícone de instalar na barra de endereço.</>,
        ],
      };
  }
}

/** Desenho da lista de opções do iPhone, com "Adicionar à Tela de Início" destacado. */
function IosShareMock() {
  const rows = ['Adicionar Favorito a...', 'Preferidos', 'Adicionar à Nota Rápida', 'Buscar na Página'];
  return (
    <figure className="mt-4" aria-label={s.mockLabel}>
      <figcaption className="mb-2 text-small font-extrabold text-heading">{s.mockTitle}</figcaption>
      <div className="overflow-hidden rounded-[18px] bg-[#3a3a3c] text-[15px] text-white shadow-card" aria-hidden="true">
        {rows.map((r) => (
          <div key={r} className="flex items-center gap-3 border-b border-white/10 px-4 py-[10px] opacity-60">
            <span className="h-5 w-5 rounded-[5px] border-2 border-white/70" />
            {r}
          </div>
        ))}
        <div className="relative flex items-center gap-3 bg-accent px-4 py-[12px] font-extrabold">
          <Icon name="plusSq" size={20} />
          Adicionar à Tela de Início
          <span className="ml-auto rounded-full bg-white px-2 py-[2px] text-[12px] font-black text-heading">{s.mockTap}</span>
        </div>
      </div>
    </figure>
  );
}

/** Folha "Instalar o app": instruções conforme o aparelho e o navegador. */
export function InstallSheet({ open, onClose, platform = detectPlatform() }: { open: boolean; onClose: () => void; platform?: Platform }) {
  const canPrompt = useInstallPrompt() !== null && platform !== 'inapp' && !platform.startsWith('ios');
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
          <Button
            label={s.installNow}
            icon="phoneDl"
            block
            onClick={async () => {
              if (await promptInstall()) {
                toast(s.installing);
                onClose();
              }
            }}
          />
          <p className="mt-2 text-center text-tiny text-textMuted">{s.fallback}</p>
        </div>
      ) : null}
      <Steps items={c.steps} />
      {platform === 'ios-safari' || platform === 'ios-chrome' || platform === 'ios-other' ? <IosShareMock /> : null}
      {c.note ? <p className="mt-3 rounded-lg bg-infoBg p-3 text-small font-semibold text-heading">{c.note}</p> : null}
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

/** Faixa verde no topo do Início: aparece até o app ser instalado (some 3 dias se fechada). */
export function InstallBanner({ onOpen }: { onOpen: () => void }) {
  const [hidden, setHidden] = useState(() => isStandalone() || isBannerDismissed());
  const justInstalled = useJustInstalled();
  if (hidden || justInstalled) return null;
  return (
    <div className="relative flex items-center gap-3 rounded-[20px] bg-primary p-[14px] text-onPrimary shadow-card">
      <img src={appIcon} alt="" className="h-11 w-11 shrink-0 rounded-[12px] ring-2 ring-white/70" />
      <div className="min-w-0 flex-1">
        <b className="block leading-tight">{s.bannerTitle}</b>
        <span className="text-tiny opacity-95">{s.bannerText}</span>
      </div>
      <button type="button" onClick={onOpen} className="min-h-[40px] shrink-0 rounded-full bg-white px-[14px] text-small font-extrabold text-heading">
        {s.bannerButton}
      </button>
      <button
        type="button"
        aria-label={s.bannerClose}
        onClick={() => {
          dismissBanner();
          setHidden(true);
        }}
        className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-heading text-white"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
