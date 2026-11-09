import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Checkbox, FormError, TextField } from '@/components/form';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { toast } from '@/components/Toast';
import { Button, IconButton } from '@/components/ui';
import { CARE, CARE_TYPES, WEEKDAYS } from '@/features/care/constants';
import { useDeleteRoutine, useRoutines, useSaveRoutine } from '@/features/care/hooks';
import { hm } from '@/features/care/logic';
import { routineSchema, type RoutineInput } from '@/features/care/schemas';
import { usePet } from '@/features/pets/hooks';
import { t } from '@/i18n/strings';

const s = t.routineForm;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const pill = (on: boolean) => `min-h-[40px] rounded-full px-[14px] text-small font-extrabold ${on ? 'bg-primary text-onPrimary' : 'bg-surface text-textMuted shadow-[inset_0_0_0_1.5px_theme(colors.line)]'}`;

/** Criar ou editar uma rotina (comida, água, passeio, remédio, banho, higiene ou outro). */
export default function RoutineForm() {
  const { petId, routineId } = useParams();
  const navigate = useNavigate();
  const { pet } = usePet(petId);
  const { data: routines } = useRoutines();
  const routine = routines?.find((r) => r.id === routineId);
  const editing = !!routineId;
  const save = useSaveRoutine();
  const del = useDeleteRoutine();
  const [newTime, setNewTime] = useState('12:00');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const { register, handleSubmit, control, reset, setValue, getValues, formState } = useForm<RoutineInput>({
    resolver: zodResolver(routineSchema),
    defaultValues: { type: 'feeding', title: CARE.feeding.suggestion, times: ['08:00', '18:00'], days: ALL_DAYS, active: true },
  });
  const type = useWatch({ control, name: 'type' });
  const times = useWatch({ control, name: 'times' });

  useEffect(() => {
    if (!routine) return;
    reset({ type: routine.type, title: routine.title, times: routine.times.map(hm), days: routine.days.length ? routine.days : ALL_DAYS, active: routine.active });
  }, [routine, reset]);

  if (!petId) return null;

  const onSubmit = handleSubmit(async (input) => {
    setError('');
    try {
      await save.mutateAsync({ petId, input, routine });
      toast(editing ? s.updated : s.created);
      navigate(-1);
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
        {editing && routines && !routine ? <p className="mb-3 text-textMuted">{s.notFound}</p> : null}
        <FormError message={error} />

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <fieldset className="mb-[14px]">
              <legend className="mb-[6px] text-small font-extrabold text-heading">{s.type}</legend>
              <div role="radiogroup" aria-label={s.type} className="flex flex-wrap gap-2">
                {CARE_TYPES.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={field.value === k}
                    onClick={() => {
                      const title = getValues('title');
                      // troca o nome sugerido junto, a não ser que a pessoa já tenha escrito outro
                      if (!title || CARE_TYPES.some((x) => CARE[x].suggestion === title)) setValue('title', CARE[k].suggestion);
                      field.onChange(k);
                    }}
                    className={`inline-flex items-center gap-1 ${pill(field.value === k)}`}
                  >
                    <Icon name={CARE[k].icon} size={18} /> {CARE[k].label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        />

        <TextField label={s.name} placeholder={s.namePlaceholder} maxLength={40} error={formState.errors.title?.message} {...register('title')} />

        <fieldset className="mb-[14px]">
          <legend className="mb-[6px] text-small font-extrabold text-heading">{s.times}</legend>
          <div className="mb-2 flex flex-wrap gap-2">
            {times.length ? (
              [...times].sort().map((tm) => (
                <span key={tm} className="inline-flex items-center gap-1 rounded-full bg-surfaceAlt py-1 pl-3 pr-1 font-extrabold text-heading">
                  {tm}
                  <button type="button" aria-label={s.removeTime(tm)} onClick={() => setValue('times', times.filter((x) => x !== tm), { shouldValidate: true })} className="grid h-8 w-8 place-items-center rounded-full text-textMuted">
                    <Icon name="x" size={16} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-tiny text-textMuted">{s.noTimes}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} aria-label={s.newTime} className="min-h-[44px] w-[130px] rounded-md bg-surface px-3 text-body shadow-[inset_0_0_0_1.5px_theme(colors.line)]" />
            <Button
              label={s.addTime}
              variant="soft"
              size="sm"
              icon="plus"
              onClick={() => {
                const v = newTime.slice(0, 5);
                if (v && !times.includes(v)) setValue('times', [...times, v], { shouldValidate: true });
              }}
            />
          </div>
          {formState.errors.times ? <p role="alert" className="mt-1 text-[13px] font-bold text-warnInk">{formState.errors.times.message ?? formState.errors.times.root?.message}</p> : null}
        </fieldset>

        <Controller
          control={control}
          name="days"
          render={({ field, fieldState }) => (
            <fieldset className="mb-[14px]">
              <legend className="mb-[6px] text-small font-extrabold text-heading">{s.days}</legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d, i) => {
                  const on = field.value.includes(i);
                  return (
                    <button key={d} type="button" aria-pressed={on} onClick={() => field.onChange(on ? field.value.filter((x) => x !== i) : [...field.value, i])} className={pill(on)}>
                      {d}
                    </button>
                  );
                })}
              </div>
              {fieldState.error ? <p role="alert" className="mt-1 text-[13px] font-bold text-warnInk">{fieldState.error.message}</p> : null}
            </fieldset>
          )}
        />

        {editing ? <Checkbox label={s.active} {...register('active')} /> : null}

        {pet?.canEdit ? <Button type="submit" label={formState.isSubmitting ? s.saving : editing ? s.save : s.create} block disabled={formState.isSubmitting} /> : null}
        {editing && routine && pet?.canEdit ? (
          <div className="mt-3"><Button label={s.delete} variant="danger" icon="trash" block onClick={() => setConfirm(true)} /></div>
        ) : null}
        {type === 'medication' ? <p className="mt-4 text-tiny text-textMuted">{s.medHint}</p> : null}
      </form>

      <Sheet open={confirm} onClose={() => setConfirm(false)} labelledBy="del-routine">
        <h2 id="del-routine" className="mb-2 text-[21px] font-black text-heading">{s.deleteTitle}</h2>
        <p className="mb-4 text-textMuted">{s.deleteText}</p>
        <div className="flex flex-col gap-[10px]">
          <Button
            label={s.deleteConfirm}
            variant="danger"
            block
            disabled={del.isPending}
            onClick={async () => {
              if (!routine) return;
              try {
                await del.mutateAsync(routine.id);
                toast(s.deleted);
                navigate(-1);
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
