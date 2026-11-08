import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pet Friends',
  slug: 'pet-friends',
  scheme: 'petfriends',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/brand/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#FFF8EF',
  android: {
    package: 'br.com.petfriends.app',
    adaptiveIcon: {
      foregroundImage: './assets/brand/adaptive-icon-foreground.png',
      backgroundColor: '#16A34A',
    },
    predictiveBackGestureEnabled: false,
  },
  ios: {
    bundleIdentifier: 'br.com.petfriends.app',
    supportsTablet: false,
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/brand/logo-horizontal.png',
        imageWidth: 240,
        resizeMode: 'contain',
        backgroundColor: '#FFF8EF',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
