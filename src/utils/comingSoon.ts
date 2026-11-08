import { Alert } from 'react-native';

import { t } from '@/i18n/strings';

/** Aviso honesto para botões cuja função chega em etapas futuras. */
export function comingSoon(what: string) {
  Alert.alert(t.common.comingSoonTitle, t.common.comingSoon(what));
}
