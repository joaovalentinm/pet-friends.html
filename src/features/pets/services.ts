import { supabase } from '@/services/supabase';
import type { Tables } from '@/types/database';
import { parseDecimal, todayIso } from '@/utils/format';
import type { PetInput } from './schemas';

export type Pet = Tables<'pets'>;
export type PetWeight = Tables<'pet_weights'>;
export type PetMember = { user_id: string; role: 'tutor' | 'guest' };
export type PetWithWeight = Pet & { lastWeight: number | null; myRole: 'tutor' | 'guest'; canEdit: boolean; members: PetMember[] };

const blankToNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

function toRow(input: PetInput) {
  return {
    name: input.name.trim(),
    species: input.species,
    sex: input.sex,
    breed: blankToNull(input.breed),
    coat: blankToNull(input.coat),
    birth_date: blankToNull(input.birthDate),
    microchip: blankToNull(input.microchip),
    chip_site: blankToNull(input.chipSite),
    allergies: blankToNull(input.allergies),
    chronic_conditions: blankToNull(input.chronicConditions),
    notes: blankToNull(input.notes),
  };
}

/** Pets que a pessoa vê (dela e compartilhados), com o último peso e o papel dela. */
export async function listPets(userId: string): Promise<PetWithWeight[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*, pet_weights(weight_kg, measured_on), pet_members(user_id, role, permission)')
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { pet_weights, pet_members, ...pet } = row;
    const last = [...(pet_weights ?? [])].sort((a, b) => b.measured_on.localeCompare(a.measured_on))[0];
    const me = (pet_members ?? []).find((m) => m.user_id === userId);
    return { ...pet, lastWeight: last ? Number(last.weight_kg) : null, myRole: me?.role ?? 'guest', canEdit: me?.permission === 'edit', members: (pet_members ?? []).map((m) => ({ user_id: m.user_id, role: m.role })) };
  });
}

export async function createPet(input: PetInput, userId: string): Promise<Pet> {
  const { data, error } = await supabase.from('pets').insert({ ...toRow(input), created_by: userId }).select().single();
  if (error) throw error;
  const w = parseDecimal(input.weight);
  if (w) await addWeight(data.id, w, todayIso(), userId);
  return data;
}

export async function updatePet(id: string, input: PetInput, userId: string, previousWeight: number | null): Promise<void> {
  const { error } = await supabase.from('pets').update(toRow(input)).eq('id', id);
  if (error) throw error;
  const w = parseDecimal(input.weight);
  if (w && w !== previousWeight) await addWeight(id, w, todayIso(), userId);
}

export async function deletePet(pet: Pet): Promise<void> {
  if (pet.photo_path) await supabase.storage.from('pet-photos').remove([pet.photo_path]);
  const { error } = await supabase.from('pets').delete().eq('id', pet.id);
  if (error) throw error;
}

export async function listWeights(petId: string): Promise<PetWeight[]> {
  const { data, error } = await supabase.from('pet_weights').select('*').eq('pet_id', petId).order('measured_on', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addWeight(petId: string, weightKg: number, measuredOn: string, userId: string) {
  const { error } = await supabase.from('pet_weights').insert({ pet_id: petId, weight_kg: weightKg, measured_on: measuredOn, recorded_by: userId });
  if (error) throw error;
}

/**
 * Reduz a foto para no máximo 1024 px e converte para JPEG. Isso deixa o envio
 * leve e REMOVE os metadados da foto (inclusive a localização GPS da casa).
 */
export async function compressPhoto(file: File, max = 1024, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível ler a foto.'))), 'image/jpeg', quality),
  );
}

/** Envia a foto para a pasta privada do pet e salva o caminho no cadastro. */
export async function uploadPetPhoto(pet: Pet, file: File): Promise<string> {
  const blob = await compressPhoto(file);
  const path = `${pet.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('pet-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { error: e2 } = await supabase.from('pets').update({ photo_path: path }).eq('id', pet.id);
  if (e2) throw e2;
  if (pet.photo_path) await supabase.storage.from('pet-photos').remove([pet.photo_path]);
  return path;
}

/** Link temporário (1 hora) para mostrar a foto. Nunca há link público. */
export async function photoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('pet-photos').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const SPECIES_LABEL = { dog: 'Cão', cat: 'Gato' } as const;
export const SEX_LABEL = { male: 'Macho', female: 'Fêmea', unknown: '' } as const;
