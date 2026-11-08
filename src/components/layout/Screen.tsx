import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Container padrão das telas: fundo creme, área segura e rolagem. */
export function Screen({ top, children }: { top?: ReactNode; children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {top}
      <ScrollView className="flex-1" contentContainerClassName="px-screen pb-6 pt-1 gap-[22px]">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
