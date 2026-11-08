import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

type Variant = 'accent' | 'primary' | 'ghost' | 'soft' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: IconName;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

const box: Record<Variant, string> = {
  accent: 'bg-accent',
  primary: 'bg-primary',
  ghost: 'bg-transparent border-2 border-primary',
  soft: 'bg-surfaceAlt',
  danger: 'bg-transparent border-2 border-warnInk',
};
const ink: Record<Variant, { cls: string; color: string }> = {
  accent: { cls: 'text-onAccent', color: colors.onAccent },
  primary: { cls: 'text-onPrimary', color: colors.onPrimary },
  ghost: { cls: 'text-heading', color: colors.heading },
  soft: { cls: 'text-heading', color: colors.heading },
  danger: { cls: 'text-warnInk', color: colors.warnInk },
};

/** Botão em pílula do protótipo. Uma ação "accent" (laranja) por tela. */
export function Button({
  label,
  onPress,
  variant = 'accent',
  size = 'md',
  icon,
  block,
  loading,
  disabled,
  accessibilityHint,
}: Props) {
  const off = disabled || loading;
  const height = size === 'sm' ? 'min-h-[38px] px-[14px]' : 'min-h-[48px] px-[22px]';
  const text = size === 'sm' ? 'text-small' : 'text-button';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      hitSlop={size === 'sm' ? 4 : 0}
      className={`flex-row items-center justify-center rounded-full ${height} ${box[variant]} ${block ? 'w-full' : 'self-start'} ${off ? 'opacity-50' : ''} active:opacity-80`}
    >
      {loading ? (
        <ActivityIndicator color={ink[variant].color} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 20} color={ink[variant].color} /> : null}
          <Text className={`font-extrabold ${text} ${ink[variant].cls}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
