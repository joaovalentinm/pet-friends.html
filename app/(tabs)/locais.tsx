import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Card, Hero } from '@/components/ui';
import { t } from '@/i18n/strings';
import { colors } from '@/theme/tokens';
import { comingSoon } from '@/utils/comingSoon';
import { formatCep } from '@/utils/cep';

export default function PlacesScreen() {
  const [cep, setCep] = useState('');
  return (
    <Screen top={<TopBar title={t.places.title} />}>
      <Hero title={t.places.heroTitle} text={t.places.heroText} />
      <Card>
        <Text nativeID="cep-label" className="mb-[6px] font-extrabold text-small text-heading">
          {t.places.cepLabel}
        </Text>
        <View className="mb-[14px]">
          <TextInput
            accessibilityLabelledBy="cep-label"
            accessibilityLabel={t.places.cepLabel}
            value={cep}
            onChangeText={(v) => setCep(formatCep(v))}
            placeholder={t.places.cepPlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={9}
            className="min-h-[48px] rounded-md border-[1.5px] border-line bg-surface px-[14px] font-regular text-body text-text"
          />
        </View>
        <Button label={t.places.search} icon="pin" block onPress={() => comingSoon('A busca de locais pelo CEP')} />
      </Card>
    </Screen>
  );
}
