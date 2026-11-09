import { avatarColors } from '@/theme/tokens';

/** Primeira letra do nome, em maiúscula ("?" se vazio). */
export function initial(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : '?';
}

/** Cor estável para o avatar: a mesma pessoa sempre recebe a mesma cor. */
export function avatarColor(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length] ?? avatarColors[0]!;
}
