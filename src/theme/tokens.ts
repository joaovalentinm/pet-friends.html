/**
 * Tokens do Design System da Pet Friends. Documentação: docs/DESIGN_SYSTEM.md
 *
 * As telas usam classes NativeWind (geradas a partir de palette.js no
 * tailwind.config.js). Use este objeto só onde classes não chegam
 * (ícones SVG, StatusBar, navegação, gráficos).
 */
import palette from './palette';

export const colors = palette.semantic;
export const brand = palette.brand;
export const avatarColors = palette.avatarColors;

export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

/** Sombra suave dos cartões (iOS) + elevation (Android). */
export const shadow = {
  shadowColor: '#14532D',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const sizes = {
  touch: 44,
  tabBar: 64,
  icon: 22,
} as const;
