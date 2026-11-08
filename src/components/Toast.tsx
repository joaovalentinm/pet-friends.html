import { useSyncExternalStore } from 'react';

let message: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Mostra um aviso curto na parte de baixo da tela. */
export function toast(text: string) {
  message = text;
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    message = null;
    emit();
  }, 2800);
}

export function Toaster() {
  const text = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => message,
  );
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-[calc(92px+env(safe-area-inset-bottom))] left-1/2 z-50 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full bg-heading px-[18px] py-[10px] text-[14.5px] font-extrabold text-white shadow-lg transition-all ${text ? 'opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}
    >
      {text}
    </div>
  );
}
