import { brand, semantic } from './src/theme/palette.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Substitui as cores padrão: só a paleta oficial existe no projeto.
    colors: {
      transparent: 'transparent',
      white: '#FFFFFF',
      orange: brand.orange,
      green: brand.green,
      cream: brand.cream,
      ...semantic,
    },
    fontFamily: {
      sans: ['Nunito', 'ui-rounded', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
    },
    fontSize: {
      tiny: ['12.5px', { lineHeight: '17px' }],
      small: ['14px', { lineHeight: '20px' }],
      body: ['16px', { lineHeight: '23px' }],
      button: ['16.5px', { lineHeight: '22px' }],
      title: ['18px', { lineHeight: '24px' }],
      h1: ['22px', { lineHeight: '28px' }],
      hero: ['26px', { lineHeight: '29px' }],
    },
    borderRadius: {
      none: '0px',
      sm: '12px',
      md: '14px',
      lg: '18px',
      xl: '22px',
      '2xl': '26px',
      full: '9999px',
    },
    extend: {
      spacing: {
        screen: '20px',
        touch: '44px',
      },
      maxWidth: { app: '480px' },
      boxShadow: {
        card: '0 1px 2px rgba(20,83,45,.06), 0 6px 18px rgba(20,83,45,.07)',
      },
    },
  },
  plugins: [],
};
