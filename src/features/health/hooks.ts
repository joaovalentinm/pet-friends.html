import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/pets/hooks';
import type { RecordInput } from './schemas';
import { createRecord, deleteDocument, deleteRecord, listDocuments, listDueRecords, listRecords, setNextStatus, updateRecord, uploadDocument, type HealthDocument, type HealthRecord } from './services';

export const healthKeys = {
  pet: (petId: string) => ['pets', petId, 'health'] as const,
  due: ['health', 'due'] as const,
  docs: (recordId: string) => ['health', recordId, 'docs'] as const,
};

export function useRecords(petId: string | undefined) {
  return useQuery({ queryKey: healthKeys.pet(petId ?? ''), queryFn: () => listRecords(petId ?? ''), enabled: !!petId });
}

export function useDueRecords() {
  return useQuery({ queryKey: healthKeys.due, queryFn: listDueRecords });
}

export function useDocuments(recordId: string | undefined) {
  return useQuery({ queryKey: healthKeys.docs(recordId ?? ''), queryFn: () => listDocuments(recordId ?? ''), enabled: !!recordId });
}

function useInvalidate() {
  const qc = useQueryClient();
  return (petId?: string) => {
    void qc.invalidateQueries({ queryKey: healthKeys.due });
    if (petId) void qc.invalidateQueries({ queryKey: healthKeys.pet(petId) });
    void qc.invalidateQueries({ queryKey: ['health'] });
  };
}

export function useSaveRecord() {
  const userId = useUserId();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (v: { petId: string; input: RecordInput; record?: HealthRecord; files: File[]; fromRecordId?: string }) => {
      const rec = v.record ? (await updateRecord(v.record.id, v.input, userId), { ...v.record, pet_id: v.petId }) : await createRecord(v.petId, v.input, userId, v.fromRecordId);
      const failed: string[] = [];
      for (const f of v.files) {
        try {
          await uploadDocument(rec, f, userId);
        } catch {
          failed.push(f.name);
        }
      }
      return { record: rec, failed };
    },
    onSettled: (_d, _e, v) => invalidate(v.petId),
  });
}

export function useDeleteRecord() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteRecord, onSettled: (_d, _e, r) => invalidate(r.pet_id) });
}

export function useNextStatus() {
  const userId = useUserId();
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (v: { record: HealthRecord; status: 'done' | 'cancelled' }) => setNextStatus(v.record.id, v.status, userId), onSettled: (_d, _e, v) => invalidate(v.record.pet_id) });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSettled: (_d, _e, doc: HealthDocument) => {
      void qc.invalidateQueries({ queryKey: healthKeys.docs(doc.health_record_id) });
      void qc.invalidateQueries({ queryKey: healthKeys.pet(doc.pet_id) });
    },
  });
}
