import { Text, View } from 'react-native';

import { avatarColor, initial } from '@/utils/avatar';

/** Avatar circular com a inicial do nome, na cor determinada pelo nome. */
export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: avatarColor(name) }}
    >
      <Text className="font-black text-white" style={{ fontSize: Math.round(size * 0.42) }}>
        {initial(name)}
      </Text>
    </View>
  );
}
