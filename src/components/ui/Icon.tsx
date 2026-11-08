import { SvgXml } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/**
 * Ícones de linha da Pet Friends (traço 2, 24×24), recriados a partir do
 * protótipo oficial. Só os ícones usados no app ficam aqui.
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
  chevD: '<path d="m6 9 6 6 6-6"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/>',
  syringe: '<path d="m18 2 4 4M20 4l-9.5 9.5M14 6l4 4M8.5 11.5l4 4"/><path d="M15.5 8.5 7 17l-3 .5.5-3L13 6"/><path d="m4.5 19.5-2 2"/>',
  clinic: '<path d="M3.5 10.5 12 4l8.5 6.5V20h-17Z"/><path d="M12 10.5v6M9 13.5h6"/>',
  hospital: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M12 7v6M9 10h6"/><path d="M10 20.5v-3.5h4v3.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
} as const;

export type IconName = keyof typeof PATHS;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color = colors.heading }: Props) {
  const xml = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
  return (
    <SvgXml xml={xml} width={size} height={size} color={color} accessibilityElementsHidden importantForAccessibility="no" />
  );
}
