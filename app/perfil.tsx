import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Card, Icon } from '@/components/ui';
import { t } from '@/i18n/strings';
import { colors, shadow } from '@/theme/tokens';

const logo = require('../assets/brand/logo-horizontal.png') as number;

export default function ProfileScreen() {
  return (
    <Screen
      top={
        <View className="min-h-[60px] flex-row items-center gap-3 px-screen py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.profile.back}
            onPress={() => router.back()}
            className="h-touch w-touch items-center justify-center rounded-[14px] bg-surface"
            style={shadow}
          >
            <Icon name="chevL" color={colors.heading} />
          </Pressable>
          <Text accessibilityRole="header" className="flex-1 font-black text-h1 text-heading">
            {t.profile.title}
          </Text>
        </View>
      }
    >
      <Card>
        <Text className="font-regular text-body text-textMuted">{t.profile.soonText}</Text>
      </Card>
      <View className="items-center pt-6">
        <Image source={logo} accessibilityLabel={t.brand.name} style={{ width: 180, height: 68 }} resizeMode="contain" />
        <Text className="mt-2 font-extrabold text-small text-heading">{t.brand.slogan}</Text>
      </View>
    </Screen>
  );
}
