import { Text, View } from 'react-native';

type Tone = 'done' | 'warn' | 'info';

const tones: Record<Tone, { box: string; ink: string }> = {
  done: { box: 'bg-doneBg', ink: 'text-doneInk' },
  warn: { box: 'bg-warnBg', ink: 'text-warnInk' },
  info: { box: 'bg-infoBg', ink: 'text-heading' },
};

/** Etiqueta em pílula (status, prazos). */
export function Badge({ label, tone = 'info' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View className={`self-start rounded-full px-[10px] py-1 ${t.box}`}>
      <Text className={`font-extrabold text-tiny ${t.ink}`}>{label}</Text>
    </View>
  );
}

/** Etiqueta "Tutor" / "Convidado" exibida ao lado dos nomes. */
export function RoleTag({ role }: { role: 'tutor' | 'guest' }) {
  const isTutor = role === 'tutor';
  return (
    <View className={`ml-1 rounded-full px-2 py-[1px] ${isTutor ? 'bg-doneBg' : 'bg-warnBg'}`}>
      <Text className={`font-extrabold text-[11px] ${isTutor ? 'text-doneInk' : 'text-warnInk'}`}>
        {isTutor ? 'Tutor' : 'Convidado'}
      </Text>
    </View>
  );
}
