import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { t } from '@/i18n/strings';
import { colors, shadow } from '@/theme/tokens';
import { Icon } from '../ui/Icon';

const logo = require('../../../assets/brand/logo-horizontal.png') as number;

type Props = {
  /** Título da tela. Sem título, mostra o logo (tela Início). */
  title?: string;
  /** Ação extra à direita (ex.: botão "+"). */
  right?: React.ReactNode;
};

/** Barra do topo: título ou logo + botão do Perfil. */
export function TopBar({ title, right }: Props) {
  return (
    <View className="min-h-[60px] flex-row items-center gap-3 bg-background px-screen py-3">
      {title ? (
        <Text accessibilityRole="header" className="flex-1 font-black text-h1 text-heading">
          {title}
        </Text>
      ) : (
        <View className="flex-1">
          <Image source={logo} accessibilityLabel={t.brand.name} style={{ height: 40, width: 108 }} resizeMode="contain" />
        </View>
      )}
      {right}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.profileButton}
        onPress={() => router.push('/perfil')}
        className="h-touch w-touch items-center justify-center rounded-[14px] bg-surface"
        style={shadow}
      >
        <Icon name="user" color={colors.heading} />
      </Pressable>
    </View>
  );
}

/** Botão quadrado de ícone usado no topo (ex.: adicionar). */
export function TopBarButton({ icon, label, onPress }: { icon: 'plus'; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-touch w-touch items-center justify-center rounded-[14px] bg-surface"
      style={shadow}
    >
      <Icon name={icon} color={colors.heading} />
    </Pressable>
  );
}
