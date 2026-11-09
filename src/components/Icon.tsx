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
  syringe: '<path d="m18 2 4 4M20 4l-9.5 9.5M14 6l4 4M8.5 11.5l4 4"/><path d="M15.5 8.5 7 17l-3 .5.5-3L13 6"/><path d="m4.5 19.5-2 2"/>',
  tablet: '<circle cx="9.5" cy="10" r="6"/><path d="m5.3 14.2 8.4-8.4"/><circle cx="17" cy="17" r="4"/><path d="m14.2 19.8 5.6-5.6"/>',
  bug: '<ellipse cx="12" cy="13" rx="4" ry="5.5"/><path d="M12 7.5V5.5M10 6l-1.5-2M14 6l1.5-2M8 11H5M8 15H5M16 11h3M16 15h3"/><path d="M4 21 20 4"/>',
  pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-40 12 12)"/><path d="m9.3 9.3 5.4 5.4"/>',
  steth: '<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M10 12v2a5 5 0 0 0 10 0v-1.5"/><circle cx="20" cy="10.5" r="2"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  doc: '<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>',
  alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17h.01"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
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
