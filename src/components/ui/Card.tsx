import type { ReactNode } from 'react';
import { View } from 'react-native';

import { shadow } from '@/theme/tokens';

/** Cartão branco arredondado com a sombra suave do protótipo. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-xl bg-surface p-4 ${className}`} style={shadow}>
      {children}
    </View>
  );
}
