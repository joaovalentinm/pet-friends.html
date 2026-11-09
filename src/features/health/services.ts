import { compressPhoto } from '@/features/pets/services';
import { supabase } from '@/services/supabase';
import type { Tables } from '@/types/database';
import type { RecordInput } from './schemas';

export type HealthRecord = Tables<'health_records'>;
export type HealthDocument = Tables<'health_documents'>;
export type RecordWithDocs = HealthRecord & { health_documents: Pick<HealthDocument, 'id'>[] };

const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

function toRow(input: RecordInput) {
  const vet = input.type === 'vaccine' || input.type === 'vet_visit' || input.type === 'exam';
  return {
    type: input.type,
    title: input.title.trim(),
    occurred_on: input.occurredOn,
    next_due_on: blank(input.nextDueOn),
    lot: input.type === 'vaccine' ? blank(input.lot) : null,
    application_form: input.type === 'flea_tick' ? blank(input.applicationForm) : null,
    vet_name: vet ? blank(input.vetName) : null,
    crmv: vet ? blank(input.crmv) : null,
    notes: blank(input.notes),
  };
}

export async function listRecords(petId: string): Promise<RecordWithDocs[]> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*, health_documents(id)')
    .eq('pet_id', petId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Próximas doses de todos os pets (base dos Lembretes de saúde). */
export async function listDueRecords(): Promise<HealthRecord[]> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .not('next_due_on', 'is', null)
    .order('next_due_on', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createRecord(petId: string, input: RecordInput, userId: string, fromRecordId?: string): Promise<HealthRecord> {
  const { data, error } = await supabase.from('health_records').insert({ ...toRow(input), pet_id: petId, created_by: userId }).select().single();
  if (error) throw error;
  // registrar a dose de um lembrete conclui o lembrete anterior
  if (fromRecordId) await supabase.from('health_records').update({ next_done_at: new Date().toISOString(), updated_by: userId }).eq('id', fromRecordId);
  return data;
}

export async function updateRecord(id: string, input: RecordInput, userId: string): Promise<void> {
  const row = toRow(input);
  const { error } = await supabase
    .from('health_records')
    .update({ ...row, updated_by: userId, ...(row.next_due_on ? { next_done_at: null, next_cancelled_at: null } : {}) })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRecord(record: HealthRecord): Promise<void> {
  const docs = await listDocuments(record.id);
  if (docs.length) await supabase.storage.from('pet-documents').remove(docs.map((d) => d.storage_path));
  const { error } = await supabase.from('health_records').delete().eq('id', record.id);
  if (error) throw error;
}

export async function setNextStatus(id: string, status: 'done' | 'cancelled', userId: string): Promise<void> {
  const now = new Date().toISOString();
  const patch = status === 'done' ? { next_done_at: now } : { next_cancelled_at: now };
  const { error } = await supabase.from('health_records').update({ ...patch, updated_by: userId }).eq('id', id);
  if (error) throw error;
}

export async function listDocuments(recordId: string): Promise<HealthDocument[]> {
  const { data, error } = await supabase.from('health_documents').select('*').eq('health_record_id', recordId).order('created_at');
  if (error) throw error;
  return data ?? [];
}

/** Anexa foto (comprimida, sem metadados) ou PDF ao registro, na pasta privada do pet. */
export async function uploadDocument(record: HealthRecord, file: File, userId: string): Promise<void> {
  const isPdf = file.type === 'application/pdf';
  if (!isPdf && !file.type.startsWith('image/')) throw new Error('tipo');
  const blob: Blob = isPdf ? file : await compressPhoto(file, 1600, 0.8);
  if (blob.size > 15 * 1024 * 1024) throw new Error('tamanho');
  const ext = isPdf ? 'pdf' : 'jpg';
  const path = `${record.pet_id}/${record.id}/${crypto.randomUUID()}.${ext}`;
  const mime = isPdf ? 'application/pdf' : 'image/jpeg';
  const { error } = await supabase.storage.from('pet-documents').upload(path, blob, { contentType: mime });
  if (error) throw error;
  const name = (file.name || `documento.${ext}`).slice(0, 120);
  const { error: e2 } = await supabase.from('health_documents').insert({
    pet_id: record.pet_id, health_record_id: record.id, storage_path: path, file_name: name, mime_type: mime, size_bytes: blob.size, uploaded_by: userId,
  });
  if (e2) {
    await supabase.storage.from('pet-documents').remove([path]);
    throw e2;
  }
}

export async function deleteDocument(doc: HealthDocument): Promise<void> {
  await supabase.storage.from('pet-documents').remove([doc.storage_path]);
  const { error } = await supabase.from('health_documents').delete().eq('id', doc.id);
  if (error) throw error;
}

/** Link temporário (10 min) para abrir o anexo. */
export async function documentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('pet-documents').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

/** Lembrete pendente = tem próxima dose e não foi feito nem cancelado. */
export const isPending = (r: HealthRecord) => !!r.next_due_on && !r.next_done_at && !r.next_cancelled_at;
