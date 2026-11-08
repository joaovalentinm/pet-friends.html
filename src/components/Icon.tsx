/**
 * Ícones de linha da Pet Friends (traço 2, 24×24), recriados a partir do
 * protótipo oficial. Cor herdada do texto (currentColor).
 */
const PATHS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  paw: '<circle cx="6" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 4.5-6 7a2.5 2.5 0 0 0 3.5 2.2c1.5-.6 3.5-.6 5 0A2.5 2.5 0 0 0 18 18c0-2.5-3-7-6-7Z"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  book: '<rect x="7" y="3" width="13.5" height="18" rx="2.2"/><path d="M4 6.5h4.5M4 10.5h4.5M4 14.5h4.5M4 18.5h4.5"/><ellipse cx="13.8" cy="14.6" rx="2.3" ry="1.9" fill="currentColor" stroke="none"/><circle cx="11.2" cy="11.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="13" cy="10" r="1.05" fill="currentColor" stroke="none"/><circle cx="14.9" cy="10" r="1.05" fill="currentColor" stroke="none"/><circle cx="16.6" cy="11.6" r="1.05" fill="currentColor" stroke="none"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevR: '<path d="m9 5 7 7-7 7"/>',
  chevL: '<path d="m15 5-7 7 7 7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  share: '<path d="M12 15V3.5M8 7.5l4-4 4 4"/><path d="M8.5 10.5H6.5A1.5 1.5 0 0 0 5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5h-2"/>',
  plusSq: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  dots: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  kebab: '<circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  phoneDl: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M10.5 18.5h3"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
