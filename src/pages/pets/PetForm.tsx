import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { FormError, OptionGroup, TextArea, TextField } from '@/components/form';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import { Button, IconButton } from '@/components/ui';
import { PetPhoto } from '@/features/pets/components/PetPhoto';
import { usePet, useSavePet } from '@/features/pets/hooks';
import { petSchema, type PetInput } from '@/features/pets/schemas';
import { t } from '@/i18n/strings';
import { todayIso } from '@/utils/format';

const s = t.petForm;

/** Cadastro e edição do pet (com foto). */
export default function PetForm() {
  const { petId } = useParams();
  const editing = !!petId;
  const navigate = useNavigate();
  const { pet, isLoading } = usePet(petId);
  const save = useSavePet();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, reset, formState } = useForm<PetInput>({
    resolver: zodResolver(petSchema),
    defaultValues: { species: 'dog', sex: 'unknown' },
  });

  useEffect(() => {
    if (!pet) return;
    reset({
      name: pet.name,
      species: pet.species,
      sex: pet.sex,
      breed: pet.breed ?? '',
      coat: pet.coat ?? '',
      birthDate: pet.birth_date ?? '',
      weight: pet.lastWeight ? String(pet.lastWeight).replace('.', ',') : '',
      microchip: pet.microchip ?? '',
      chipSite: pet.chip_site ?? '',
      allergies: pet.allergies ?? '',
      chronicConditions: pet.chronic_conditions ?? '',
      notes: pet.notes ?? '',
    });
  }, [pet, reset]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onSubmit = handleSubmit(async (input) => {
    setError('');
    try {
      const saved = await save.mutateAsync({ input, photo, pet: editing ? pet : undefined });
      toast(editing ? s.saved : s.created(input.name));
      navigate(`/pets/${saved.id}`, { replace: true });
    } catch {
      setError(s.error);
    }
  });

  if (editing && !isLoading && !pet) return <p className="p-6 text-textMuted">{s.notFound}</p>;

  return (
    <div className="mx-auto min-h-screen max-w-app bg-background">
      <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <IconButton icon="chevL" label={t.profile.back} onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-h1 font-black text-heading">{editing ? s.editTitle : s.newTitle}</h1>
      </header>
      <form onSubmit={onSubmit} noValidate className="px-screen pb-10">
        <FormError message={error} />
        <div className="mb-[14px] flex items-center gap-[14px]">
          {preview ? (
            <img src={preview} alt="" className="h-[76px] w-[76px] rounded-full object-cover" />
          ) : (
            <PetPhoto path={pet?.photo_path} name={pet?.name ?? ''} size={76} />
          )}
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-surfaceAlt px-[14px] text-small font-extrabold text-heading">
              <Icon name="plus" size={18} />
              {pet?.photo_path || preview ? s.changePhoto : s.addPhoto}
            </button>
            <p className="mt-1 text-tiny text-textMuted">{s.photoHint}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={s.addPhoto}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 25 * 1024 * 1024) return setError(s.photoTooBig);
                setPhoto(f);
                setPreview(URL.createObjectURL(f));
              }}
            />
          </div>
        </div>

        <TextField label={s.name} placeholder={s.namePlaceholder} maxLength={30} error={formState.errors.name?.message} {...register('name')} />
        <Controller
          control={control}
          name="species"
          render={({ field }) => (
            <OptionGroup label={s.species} value={field.value} onChange={field.onChange} options={[{ value: 'dog', label: 'Cão' }, { value: 'cat', label: 'Gato' }]} error={formState.errors.species?.message} />
          )}
        />
        <Controller
          control={control}
          name="sex"
          render={({ field }) => (
            <OptionGroup label={s.sex} value={field.value} onChange={field.onChange} options={[{ value: 'male', label: 'Macho' }, { value: 'female', label: 'Fêmea' }, { value: 'unknown', label: 'Não sei' }]} />
          )}
        />
        <div className="grid grid-cols-2 gap-[10px]">
          <TextField label={s.breed} placeholder="SRD, Golden..." maxLength={40} error={formState.errors.breed?.message} {...register('breed')} />
          <TextField label={s.coat} placeholder={s.coatPlaceholder} maxLength={40} error={formState.errors.coat?.message} {...register('coat')} />
        </div>
        <div className="grid grid-cols-2 gap-[10px]">
          <TextField label={s.birth} type="date" max={todayIso()} error={formState.errors.birthDate?.message} {...register('birthDate')} />
          <TextField label={s.weight} inputMode="decimal" placeholder="0,0" error={formState.errors.weight?.message} {...register('weight')} />
        </div>
        <div className="grid grid-cols-2 gap-[10px]">
          <TextField label={s.microchip} inputMode="numeric" placeholder={s.ifAny} maxLength={30} error={formState.errors.microchip?.message} {...register('microchip')} />
          <TextField label={s.chipSite} placeholder={s.chipSitePlaceholder} maxLength={40} error={formState.errors.chipSite?.message} {...register('chipSite')} />
        </div>
        <TextField label={s.allergies} placeholder={s.allergiesPlaceholder} maxLength={150} error={formState.errors.allergies?.message} {...register('allergies')} />
        <TextField label={s.chronic} placeholder={s.chronicPlaceholder} maxLength={150} error={formState.errors.chronicConditions?.message} {...register('chronicConditions')} />
        <TextArea label={s.notes} placeholder={s.notesPlaceholder} maxLength={300} error={formState.errors.notes?.message} {...register('notes')} />
        <Button type="submit" label={formState.isSubmitting ? s.saving : editing ? s.save : s.create} block disabled={formState.isSubmitting} />
      </form>
    </div>
  );
}
