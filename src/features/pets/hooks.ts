import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/stores/auth';
import type { PetInput } from './schemas';
import { createPet, deletePet, listPets, listWeights, photoUrl, updatePet, uploadPetPhoto, type Pet } from './services';

export const petKeys = {
  all: ['pets'] as const,
  weights: (id: string) => ['pets', id, 'weights'] as const,
  photo: (path: string) => ['pet-photo', path] as const,
};

export function useUserId(): string {
  return useAuth((s) => s.session?.user.id ?? '');
}

export function usePets() {
  const userId = useUserId();
  return useQuery({ queryKey: petKeys.all, queryFn: () => listPets(userId), enabled: !!userId });
}

export function usePet(id: string | undefined) {
  const q = usePets();
  return { ...q, pet: q.data?.find((p) => p.id === id) };
}

export function useWeights(petId: string | undefined) {
  return useQuery({ queryKey: petKeys.weights(petId ?? ''), queryFn: () => listWeights(petId ?? ''), enabled: !!petId });
}

export function usePhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: petKeys.photo(path ?? ''),
    queryFn: () => photoUrl(path ?? ''),
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  });
}

export function useSavePet() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (v: { input: PetInput; photo?: File | null; pet?: Pet & { lastWeight?: number | null } }) => {
      const pet = v.pet ? (await updatePet(v.pet.id, v.input, userId, v.pet.lastWeight ?? null), v.pet) : await createPet(v.input, userId);
      if (v.photo) await uploadPetPhoto(pet, v.photo);
      return pet;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: petKeys.all }),
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deletePet, onSettled: () => qc.invalidateQueries({ queryKey: petKeys.all }) });
}
