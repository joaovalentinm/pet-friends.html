import { toast } from '@/components/Toast';
import { t } from '@/i18n/strings';

/** Aviso honesto para botões cuja função chega em etapas futuras. */
export function comingSoon(what: string) {
  toast(t.common.comingSoon(what));
}
