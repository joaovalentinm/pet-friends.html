import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Hills } from './Hills';

type Props = { title: string; text?: string; children?: ReactNode };

/** Bloco de destaque com as colinas da marca (topo do Início e de Locais). */
export function Hero({ title, text, children }: Props) {
  return (
    <View className="relative mt-[6px] overflow-hidden rounded-2xl bg-surfaceAlt px-5 pb-16 pt-5">
      <Text className="mb-[6px] font-black text-hero text-heading">{title}</Text>
      {text ? <Text className="max-w-[300px] font-regular text-body text-textMuted">{text}</Text> : null}
      {children}
      <Hills />
    </View>
  );
}
