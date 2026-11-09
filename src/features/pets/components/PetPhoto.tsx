import { Icon } from '@/components/Icon';
import { usePhotoUrl } from '../hooks';

/** Foto do pet (link temporário da pasta privada) ou patinha quando não há foto. */
export function PetPhoto({ path, name, size = 48, ring = false }: { path: string | null | undefined; name: string; size?: number; ring?: boolean }) {
  const { data: url } = usePhotoUrl(path);
  const ringCls = ring ? 'shadow-[0_0_0_3px_theme(colors.surface),0_0_0_5.5px_theme(colors.accent)]' : '';
  return url ? (
    <img src={url} alt={`Foto de ${name}`} className={`shrink-0 rounded-full object-cover ${ringCls}`} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-surfaceAlt text-accent ${ringCls}`} style={{ width: size, height: size }}>
      <Icon name="paw" size={Math.round(size * 0.5)} />
    </span>
  );
}
