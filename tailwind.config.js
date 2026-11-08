/** @type {import('tailwindcss').Config} */
const { brand, semantic } = require('./src/theme/palette');

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
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
      regular: ['Nunito_400Regular'],
      semibold: ['Nunito_600SemiBold'],
      bold: ['Nunito_700Bold'],
      extrabold: ['Nunito_800ExtraBold'],
      black: ['Nunito_900Black'],
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
    },
  },
  plugins: [],
};
