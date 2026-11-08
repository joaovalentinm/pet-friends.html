import { Text } from 'react-native';

import { colors } from '@/theme/tokens';
import { Button } from './Button';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Estado vazio: ícone laranja, título, explicação e uma ação. */
export function EmptyState({ icon, title, text, actionLabel, onAction }: Props) {
  return (
    <Card className="items-center px-[18px] py-7">
      <Icon name={icon} size={44} color={colors.accent} />
      <Text className="mb-1 mt-[10px] text-center font-black text-title text-heading">{title}</Text>
      <Text className="mb-4 text-center font-regular text-body text-textMuted">{text}</Text>
      {actionLabel ? <Button label={actionLabel} icon="plus" onPress={onAction} /> : null}
    </Card>
  );
}
