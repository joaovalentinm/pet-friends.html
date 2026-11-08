import { useSyncExternalStore } from 'react';

/** Evento do Chrome que permite mostrar o botão "Instalar agora". */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallPromptEvent | null = null;
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
    emit();
  });
}

export function useInstallPrompt() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => deferred,
    () => null,
  );
}

/** Mostra o diálogo nativo de instalação. Retorna true se a pessoa aceitou. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null;
  emit();
  await e.prompt();
  const choice = await e.userChoice;
  return choice.outcome === 'accepted';
}

export type Platform = 'inapp' | 'ios' | 'android' | 'desktop';

/** Descobre onde o link foi aberto, para mostrar as instruções certas. */
export function detectPlatform(ua: string = navigator.userAgent, touchPoints: number = navigator.maxTouchPoints): Platform {
  if (/Instagram|FBAN|FBAV|FB_IAB|WhatsApp|Line\/|TikTok|musical_ly|Snapchat|Twitter|; wv\)/i.test(ua)) return 'inapp';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

/** O app já está aberto como app instalado (tela de início)? */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches === true || nav.standalone === true;
}
