import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui';
import { t } from '@/i18n/strings';
import { colors, fonts, sizes } from '@/theme/tokens';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: t.tabs.home, icon: 'home' },
  { name: 'pets', title: t.tabs.pets, icon: 'paw' },
  { name: 'caderneta', title: t.tabs.booklet, icon: 'book' },
  { name: 'lembretes', title: t.tabs.reminders, icon: 'bell' },
  { name: 'locais', title: t.tabs.places, icon: 'pin' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.extrabold, fontSize: 11.5 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          minHeight: sizes.tabBar,
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} size={24} color={String(color)} />,
          }}
        />
      ))}
    </Tabs>
  );
}
