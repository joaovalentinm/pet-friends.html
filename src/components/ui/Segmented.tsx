import { Pressable, Text, View } from 'react-native';

import { shadow } from '@/theme/tokens';

type Option<K extends string> = { key: K; label: string };

type Props<K extends string> = {
  options: readonly Option<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
};

/** Controle segmentado em pílula (ex.: Próximos · Atrasados · Concluídos). */
export function Segmented<K extends string>({ options, value, onChange, label }: Props<K>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} className="flex-row gap-[2px] rounded-full bg-surfaceAlt p-1">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${on ? 'bg-surface' : ''}`}
            style={on ? shadow : undefined}
          >
            <Text className={`font-extrabold text-small ${on ? 'text-heading' : 'text-textMuted'}`}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
