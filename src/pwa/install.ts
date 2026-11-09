import { useSyncExternalStore } from 'react';

/** Evento do Chrome (Android/computador) que permite abrir o diálogo nativo "Instalar app". */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** O navegador permite instalar com um toque ("Instalar agora")? */
export function useInstallPrompt() {
  return useSyncExternalStore(subscribe, () => deferred, () => null);
}

/** Acabou de ser instalado nesta visita? */
export function useJustInstalled() {
  return useSyncExternalStore(subscribe, () => installed, () => false);
}

/** Abre o diálogo nativo de instalação. Retorna true se a pessoa aceitou. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null;
  emit();
  await e.prompt();
  const choice = await e.userChoice;
  return choice.outcome === 'accepted';
}

export type Platform =
  | 'inapp' // dentro do Instagram, WhatsApp, Facebook...
  | 'ios-safari'
  | 'ios-chrome'
  | 'ios-other' // Firefox, Edge... no iPhone
  | 'android-chrome'
  | 'android-samsung'
  | 'android-other'
  | 'desktop';

/** Descobre o aparelho e o navegador, para mostrar as instruções certas. */
export function detectPlatform(ua: string = navigator.userAgent, touchPoints: number = navigator.maxTouchPoints): Platform {
  if (/Instagram|FBAN|FBAV|FB_IAB|WhatsApp|Line\/|TikTok|musical_ly|Snapchat|Twitter|GSA\/|; wv\)/i.test(ua)) return 'inapp';
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
  if (ios) {
    if (/CriOS/i.test(ua)) return 'ios-chrome';
    if (/FxiOS|EdgiOS|OPiOS/i.test(ua)) return 'ios-other';
    return 'ios-safari';
  }
  if (/Android/i.test(ua)) {
    if (/SamsungBrowser/i.test(ua)) return 'android-samsung';
    if (/Chrome\//i.test(ua) && !/EdgA|OPR|Firefox/i.test(ua)) return 'android-chrome';
    return 'android-other';
  }
  return 'desktop';
}

/** Já está aberto como app instalado (pelo ícone da tela de início)? */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches === true || nav.standalone === true;
}

/* ---- lembrar o que a pessoa já viu (só conforto; sem dados pessoais) ---- */
const SEEN = 'pf.install.autoShown';
const DISMISSED = 'pf.install.bannerDismissedAt';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* navegador sem armazenamento: segue sem lembrar */
  }
}

/** Abrir sozinho a explicação de instalar logo após o login (uma vez por aparelho). */
export function shouldAutoShowInstall(): boolean {
  return !isStandalone() && read(SEEN) !== '1';
}
export function markInstallAutoShown() {
  write(SEEN, '1');
}

/** A faixa "Instale o app" volta 3 dias depois de fechada. */
export function isBannerDismissed(now: number = Date.now()): boolean {
  const at = Number(read(DISMISSED) ?? 0);
  return at > 0 && now - at < 3 * 24 * 60 * 60 * 1000;
}
export function dismissBanner() {
  write(DISMISSED, String(Date.now()));
}
