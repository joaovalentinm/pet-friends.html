import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { FormError, OptionGroup, TextArea, TextField } from '@/components/form';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { toast } from '@/components/Toast';
import { Button, IconButton } from '@/components/ui';
import { APPLICATION_FORMS, HEALTH, HEALTH_TYPES, suggestions, WITH_VET, type HealthType } from '@/features/health/constants';
import { useDeleteDocument, useDeleteRecord, useDocuments, useRecords, useSaveRecord } from '@/features/health/hooks';
import { recordSchema, type RecordInput } from '@/features/health/schemas';
import { documentUrl } from '@/features/health/services';
import { usePet } from '@/features/pets/hooks';
import { t } from '@/i18n/strings';
import { todayIso } from '@/utils/format';

const s = t.healthForm;
const MAX_FILES = 3;

/** Registrar ou editar vacina, vermífugo, antipulgas, medicamento, consulta ou exame. */
export default function HealthForm() {
  const { petId, recordId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pet } = usePet(petId);
  const { data: records } = useRecords(petId);
  const record = records?.find((r) => r.id === recordId);
  const editing = !!recordId;
  const { data: docs } = useDocuments(recordId);
  const save = useSaveRecord();
  const del = useDeleteRecord();
  const delDoc = useDeleteDocument();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initialType = (params.get('tipo') as HealthType | null) ?? 'vaccine';
  const { register, handleSubmit, control, reset, setValue, formState } = useForm<RecordInput>({
    resolver: zodResolver(recordSchema),
    defaultValues: { type: HEALTH_TYPES.includes(initialType) ? initialType : 'vaccine', title: params.get('nome') ?? '', occurredOn: todayIso() },
  });
  const type = useWatch({ control, name: 'type' });

  useEffect(() => {
    if (!record) return;
    reset({
      type: record.type,
      title: record.title,
      occurredOn: record.occurred_on,
      nextDueOn: record.next_done_at || record.next_cancelled_at ? '' : (record.next_due_on ?? ''),
      lot: record.lot ?? '',
      applicationForm: (record.application_form as RecordInput['applicationForm']) ?? '',
      vetName: record.vet_name ?? '',
      crmv: record.crmv ?? '',
      notes: record.notes ?? '',
    });
  }, [record, reset]);

  if (!petId) return null;
  const canEdit = pet?.canEdit ?? false;
  const totalFiles = (docs?.length ?? 0) + files.length;

  const onSubmit = handleSubmit(async (input) => {
    setError('');
    try {
      const { failed } = await save.mutateAsync({ petId, input, record, files, fromRecordId: params.get('de') ?? undefined });
      toast(failed.length ? s.savedSomeFailed(failed.length) : editing ? s.updated : s.saved);
      navigate(`/pets/${petId}`, { replace: true });
    } catch {
      setError(s.error);
    }
  });

  return (
    <div className="mx-auto min-h-screen max-w-app bg-background">
      <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <IconButton icon="chevL" label={t.profile.back} onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-h1 font-black text-heading">{editing ? s.editTitle : s.newTitle}</h1>
      </header>
      <form onSubmit={onSubmit} noValidate className="px-screen pb-10">
        {pet ? <p className="-mt-1 mb-3 text-small font-bold text-textMuted">{pet.name}</p> : null}
        {!canEdit && pet ? <p className="mb-3 rounded-lg bg-infoBg p-3 text-small font-bold text-heading">{s.viewOnly}</p> : null}
        <FormError message={error} />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <OptionGroup label={s.type} value={field.value} onChange={field.onChange} options={HEALTH_TYPES.map((k) => ({ value: k, label: HEALTH[k].label }))} />
          )}
        />
        <TextField label={s.name} placeholder={HEALTH[type].placeholder} maxLength={60} error={formState.errors.title?.message} {...register('title')} />
        {pet && suggestions(type, pet.species).length ? (
          <div className="-mt-2 mb-[14px] flex flex-wrap gap-2">
            {suggestions(type, pet.species).map((sug) => (
              <button key={sug} type="button" onClick={() => setValue('title', sug, { shouldValidate: true })} className="min-h-[34px] rounded-full bg-surface px-3 text-small font-bold text-textMuted shadow-[inset_0_0_0_1.5px_theme(colors.line)]">
                {sug}
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-[10px]">
          <TextField label={s.date} type="date" max={todayIso()} error={formState.errors.occurredOn?.message} {...register('occurredOn')} />
          <TextField label={s.next} type="date" hint={s.nextHint} error={formState.errors.nextDueOn?.message} {...register('nextDueOn')} />
        </div>
        {type === 'vaccine' ? <TextField label={s.lot} placeholder={s.lotPlaceholder} maxLength={40} error={formState.errors.lot?.message} {...register('lot')} /> : null}
        {type === 'flea_tick' ? (
          <Controller
            control={control}
            name="applicationForm"
            render={({ field }) => (
              <OptionGroup label={s.form} value={field.value || undefined} onChange={field.onChange} options={APPLICATION_FORMS.map((f) => ({ value: f, label: f }))} />
            )}
          />
        ) : null}
        {WITH_VET.includes(type) ? (
          <div className="grid grid-cols-2 gap-[10px]">
            <TextField label={s.vet} placeholder={s.vetPlaceholder} maxLength={60} error={formState.errors.vetName?.message} {...register('vetName')} />
            <TextField label="CRMV" placeholder="Ex.: RJ 12345" maxLength={20} error={formState.errors.crmv?.message} {...register('crmv')} />
          </div>
        ) : null}
        <TextArea label={s.notes} placeholder={s.notesPlaceholder} maxLength={400} error={formState.errors.notes?.message} {...register('notes')} />

        <fieldset className="mb-5">
          <legend className="mb-[6px] text-small font-extrabold text-heading">{s.attachments}</legend>
          <div className="mb-2 flex flex-wrap gap-2">
            {docs?.map((d) => (
              <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-infoBg py-1 pl-3 pr-1 text-tiny font-extrabold text-heading">
                <Icon name="doc" size={14} />
                <button type="button" className="max-w-[150px] truncate underline" onClick={async () => { const url = await documentUrl(d.storage_path); if (url) window.open(url, '_blank', 'noopener'); }}>
                  {d.file_name}
                </button>
                {canEdit ? (
                  <button type="button" aria-label={s.removeAttachment(d.file_name)} onClick={() => delDoc.mutate(d)} className="grid h-7 w-7 place-items-center rounded-full text-textMuted">
                    <Icon name="x" size={14} />
                  </button>
                ) : null}
              </span>
            ))}
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-warnBg py-1 pl-3 pr-1 text-tiny font-extrabold text-warnInk">
                <Icon name="clip" size={14} />
                <span className="max-w-[150px] truncate">{f.name}</span>
                <button type="button" aria-label={s.removeAttachment(f.name)} onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} className="grid h-7 w-7 place-items-center rounded-full">
                  <Icon name="x" size={14} />
                </button>
              </span>
            ))}
          </div>
          {canEdit && totalFiles < MAX_FILES ? (
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-surfaceAlt px-[14px] text-small font-extrabold text-heading">
              <Icon name="clip" size={18} /> {s.attach}
            </button>
          ) : null}
          <p className="mt-1 text-tiny text-textMuted">{s.attachHint}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            aria-label={s.attach}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (f.type === 'application/pdf' && f.size > 15 * 1024 * 1024) return setError(s.fileTooBig);
              setFiles((fs) => [...fs, f].slice(0, MAX_FILES - (docs?.length ?? 0)));
            }}
          />
        </fieldset>

        {canEdit ? <Button type="submit" label={formState.isSubmitting ? s.saving : editing ? s.saveChanges : s.save} block disabled={formState.isSubmitting} /> : null}
        {editing && canEdit ? (
          <div className="mt-3">
            <Button label={s.delete} variant="danger" icon="trash" block onClick={() => setConfirm(true)} />
          </div>
        ) : null}
      </form>

      <Sheet open={confirm} onClose={() => setConfirm(false)} labelledBy="del-rec">
        <h2 id="del-rec" className="mb-2 text-[21px] font-black text-heading">{s.deleteTitle}</h2>
        <p className="mb-4 text-textMuted">{s.deleteText}</p>
        <div className="flex flex-col gap-[10px]">
          <Button
            label={del.isPending ? s.deleting : s.deleteConfirm}
            variant="danger"
            block
            disabled={del.isPending}
            onClick={async () => {
              if (!record) return;
              try {
                await del.mutateAsync(record);
                toast(s.deleted);
                navigate(`/pets/${petId}`, { replace: true });
              } catch {
                toast(s.error);
              }
            }}
          />
          <Button label={t.petDetail.back} variant="soft" block onClick={() => setConfirm(false)} />
        </div>
      </Sheet>
    </div>
  );
}
