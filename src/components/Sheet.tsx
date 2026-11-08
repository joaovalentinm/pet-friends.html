import { useEffect, useRef, type ReactNode } from 'react';

type Props = { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode };

/** Folha que sobe da parte de baixo (como no protótipo). Fecha com Esc ou tocando fora. */
export function Sheet({ open, onClose, labelledBy, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const last = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      last?.focus?.();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-overlay transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        hidden={!open}
        className="fixed bottom-0 left-1/2 z-50 max-h-[92vh] w-full max-w-app -translate-x-1/2 overflow-auto rounded-t-[28px] bg-background px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[10px] outline-none"
      >
        <div className="mx-auto mb-3 h-[5px] w-11 rounded bg-line" />
        {children}
      </div>
    </>
  );
}
