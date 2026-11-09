import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useUserId } from '@/features/pets/hooks';
import { supabase } from '@/services/supabase';
import { todayIso } from '@/utils/format';
import type { RoutineInput } from './schemas';
import { createRoutine, deleteLog, deleteRoutine, listPetLogs, listRoutines, listTodayLogs, logCare, updateRoutine, type CareLog, type Routine } from './services';

export const careKeys = {
  all: ['care'] as const,
  routines: ['care', 'routines'] as const,
  today: () => ['care', 'today', todayIso()] as const,
  pet: (petId: string) => ['pets', petId, 'care'] as const,
};

const isCareKey = (key: readonly unknown[]) => key[0] === 'care' || (key[0] === 'pets' && key[2] === 'care');

function useInvalidateCare() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ predicate: (q) => isCareKey(q.queryKey) });
}

export function useRoutines() {
  const userId = useUserId();
  return useQuery({ queryKey: careKeys.routines, queryFn: listRoutines, enabled: !!userId });
}

export function useTodayLogs() {
  const userId = useUserId();
  // refaz a busca de minuto em minuto para os "atrasados" aparecerem sem recarregar
  return useQuery({ queryKey: careKeys.today(), queryFn: listTodayLogs, enabled: !!userId, refetchInterval: 60_000 });
}

export function usePetLogs(petId: string | undefined) {
  return useQuery({ queryKey: careKeys.pet(petId ?? ''), queryFn: () => listPetLogs(petId ?? ''), enabled: !!petId });
}

export function useSaveRoutine() {
  const userId = useUserId();
  const invalidate = useInvalidateCare();
  return useMutation({
    mutationFn: (v: { petId: string; input: RoutineInput; routine?: Routine }) =>
      v.routine ? updateRoutine(v.routine.id, v.input) : createRoutine(v.petId, v.input, userId).then(() => undefined),
    onSettled: invalidate,
  });
}

export function useDeleteRoutine() {
  const invalidate = useInvalidateCare();
  return useMutation({ mutationFn: deleteRoutine, onSettled: invalidate });
}

export function useLogCare() {
  const userId = useUserId();
  const invalidate = useInvalidateCare();
  return useMutation({ mutationFn: (v: Parameters<typeof logCare>[0]) => logCare(v, userId), onSettled: invalidate });
}

export function useUndoLog() {
  const invalidate = useInvalidateCare();
  return useMutation({ mutationFn: (log: CareLog) => deleteLog(log.id), onSettled: invalidate });
}

/** Quando alguém da família marca um cuidado, a tela de todos se atualiza na hora. */
export function useCareRealtime(enabled: boolean) {
  const invalidate = useInvalidateCare();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('care-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'care_logs' }, () => void invalidate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'care_routines' }, () => void invalidate())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
