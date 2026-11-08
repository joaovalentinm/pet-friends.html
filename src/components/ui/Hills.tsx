import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { brand } from '@/theme/tokens';

/** As "colinas" verde e laranja da marca, no rodapé de blocos de destaque. */
export function Hills({ height = 70 }: { height?: number }) {
  return (
    <Svg
      viewBox="0 0 400 80"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      style={styles.hills}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M0 80V52C70 10 170 8 250 50L250 80Z" fill={brand.green} />
      <Path d="M190 80C240 30 330 18 400 40V80Z" fill={brand.orange} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  hills: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
