import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { OptionGroup, TextField } from '@/components/form';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { toast } from '@/components/Toast';
import { Avatar, Button, Card, EmptyState, RoleTag } from '@/components/ui';
import { PetPhoto } from '@/features/pets/components/PetPhoto';
import { useUserId } from '@/features/pets/hooks';
import type { PetWithWeight } from '@/features/pets/services';
import { t } from '@/i18n/strings';
import { dateShort, todayIso } from '@/utils/format';
import { CARE, CARE_TYPES, type CareType } from './constants';
import { useLogCare, usePetLogs, useRoutines, useUndoLog } from './hooks';
import { clock, daysText, hm, slotsFor, type Slot } from './logic';
import { AlreadyDoneError, type CareLog, type Routine } from './services';

const s = t.care;

function useWho() {
  const me = useUserId();
  return (log: CareLog) => (log.done_by === me ? s.you : (log.done_by_profile?.full_name.split(' ')[0] ?? s.someone));
}

function roleOf(pet: PetWithWeight | undefined, userId: string | null) {
  return pet?.members.find((m) => m.user_id === userId)?.role;
}

function feedback(err: unknown) {
  toast(err instanceof AlreadyDoneError ? s.alreadyDone : s.error);
}

/** Bloco do pet no Início: progresso do dia e horários da rotina para marcar. */
export function PetCareBlock({ pet, routines, logs }: { pet: PetWithWeight; routines: Routine[]; logs: CareLog[] }) {
  const navigate = useNavigate();
  const who = useWho();
  const log = useLogCare();
  const undo = useUndoLog();
  const [open, setOpen] = useState<Slot<Routine, CareLog> | null>(null);
  const slots = slotsFor(routines, logs, pet.id);
  const done = slots.filter((x) => x.log).length;

  const mark = async (slot: Slot<Routine, CareLog>) => {
    if (slot.log) return setOpen(slot);
    if (!pet.canEdit) return toast(s.viewOnly);
    try {
      await log.mutateAsync({ petId: pet.id, type: slot.routine.type, title: slot.routine.title, routineId: slot.routine.id, slotTime: slot.time });
      toast(s.slotRegistered(slot.routine.title));
    } catch (e) {
      feedback(e);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl bg-surface shadow-card">
      <Link to={`/pets/${pet.id}`} className="flex items-center gap-3 p-[14px]">
        <PetPhoto path={pet.photo_path} name={pet.name} size={48} />
        <span className="min-w-0 flex-1">
          <b className="block truncate text-title text-heading">{pet.name}</b>
          <span className="text-tiny text-textMuted">{slots.length ? s.doneOf(done, slots.length) : s.noRoutineToday}</span>
        </span>
        {slots.length ? (
          <span aria-hidden="true" className="h-2 w-16 overflow-hidden rounded-full bg-surfaceAlt">
            <span className="block h-full rounded-full bg-green" style={{ width: `${(done / slots.length) * 100}%` }} />
          </span>
        ) : null}
      </Link>
      {slots.length ? (
        <ul className="flex flex-col gap-2 px-[14px] pb-[14px]">
          {slots.map((slot) => {
            const c = CARE[slot.routine.type];
            const role = slot.log ? roleOf(pet, slot.log.done_by) : undefined;
            return (
              <li key={`${slot.routine.id}-${slot.time}`}>
                <button
                  type="button"
                  onClick={() => void mark(slot)}
                  aria-label={s.slotLabel(slot.routine.title, slot.time, !!slot.log)}
                  disabled={log.isPending}
                  className={`flex min-h-[56px] w-full items-center gap-3 rounded-lg p-[10px] text-left ${slot.log ? 'bg-doneBg' : slot.late ? 'bg-warnBg' : 'bg-background'}`}
                >
                  <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] bg-surface ${slot.log ? 'text-doneInk' : 'text-accent'}`}><Icon name={c.icon} /></span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-text">{slot.routine.title}</b>
                    <span className={`block text-[13px] ${slot.late ? 'font-bold text-warnInk' : 'text-textMuted'}`}>
                      {slot.log ? <>{s.doneBy(who(slot.log), clock(slot.log.done_at))}{role ? <RoleTag role={role} /> : null}</> : slot.late ? s.lateAt(slot.time) : s.at(slot.time)}
                    </span>
                  </span>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${slot.log ? 'bg-green text-white' : 'shadow-[inset_0_0_0_2px_theme(colors.line)] text-transparent'}`}>
                    <Icon name="check" size={18} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : pet.canEdit ? (
        <div className="px-[14px] pb-[14px]">
          <Button label={s.createRoutine} variant="soft" size="sm" icon="plus" onClick={() => navigate(`/pets/${pet.id}/rotina/nova`)} />
        </div>
      ) : null}

      <Sheet open={!!open} onClose={() => setOpen(null)} labelledBy="slot-done">
        {open?.log ? (
          <>
            <h2 id="slot-done" className="mb-3 text-[21px] font-black text-heading">{s.alreadyTitle(open.routine.title)}</h2>
            {open.routine.type === 'medication' ? (
              <div role="alert" className="mb-3 flex gap-2 rounded-lg bg-warnBg p-3 font-bold text-warnInk">
                <Icon name="alert" /> <span>{s.medAlert(who(open.log), open.time, pet.name)}</span>
              </div>
            ) : null}
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-doneBg p-3">
              <Avatar name={who(open.log)} />
              <span>
                <b className="block">{who(open.log)} {CARE[open.routine.type].verb}</b>
                <span className="text-small text-textMuted">{s.todayAt(clock(open.log.done_at))}{open.log.notes ? ` · ${open.log.notes}` : ''}</span>
              </span>
            </div>
            <div className="flex flex-col gap-[10px]">
              <Button label={s.understood} variant="soft" block onClick={() => setOpen(null)} />
              {pet.canEdit ? (
                <Button
                  label={s.undo}
                  variant="danger"
                  block
                  onClick={async () => {
                    const l = open.log;
                    setOpen(null);
                    if (!l) return;
                    try {
                      await undo.mutateAsync(l);
                      toast(s.undone);
                    } catch {
                      toast(s.error);
                    }
                  }}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </Sheet>
    </section>
  );
}

/** "Registrar agora": cuidado avulso (fora da rotina) com observação. */
export function QuickCare({ pets }: { pets: PetWithWeight[] }) {
  const navigate = useNavigate();
  const editable = pets.filter((p) => p.canEdit);
  const log = useLogCare();
  const [type, setType] = useState<CareType | 'vet' | null>(null);
  const [petId, setPetId] = useState<string>('');
  const [notes, setNotes] = useState('');
  if (!editable.length) return null;

  const start = (k: CareType | 'vet') => {
    const only = editable.length === 1 ? editable[0] : undefined;
    if (k === 'vet' && only) return navigate(`/pets/${only.id}/saude/novo?tipo=vet_visit`);
    setPetId(only?.id ?? '');
    setNotes('');
    setType(k);
  };
  const pet = editable.find((p) => p.id === petId);
  const label = type === 'vet' ? s.lastVet : type ? CARE[type].label : '';

  return (
    <section>
      <h2 className="mb-[10px] text-title font-black text-heading">{s.quickTitle}</h2>
      <div className="grid grid-cols-4 gap-2">
        {CARE_TYPES.filter((k) => k !== 'custom').map((k) => (
          <button key={k} type="button" onClick={() => start(k)} className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-lg bg-surface p-2 text-[12.5px] font-extrabold text-heading shadow-card">
            <span className="text-accent"><Icon name={CARE[k].icon} size={26} /></span>
            {CARE[k].label}
          </button>
        ))}
        <button type="button" onClick={() => start('vet')} className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-lg bg-surface p-2 text-center text-[12px] font-extrabold leading-tight text-heading shadow-card">
          <span className="text-accent"><Icon name="steth" size={26} /></span>
          {s.lastVet}
        </button>
        <button type="button" onClick={() => start('custom')} className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-lg bg-surface p-2 text-[12.5px] font-extrabold text-heading shadow-card">
          <span className="text-accent"><Icon name="star" size={26} /></span>
          {CARE.custom.label}
        </button>
      </div>

      <Sheet open={!!type} onClose={() => setType(null)} labelledBy="quick-title">
        <h2 id="quick-title" className="mb-3 text-[21px] font-black text-heading">{type === 'vet' ? s.lastVet : s.quickSheetTitle(label)}</h2>
        {editable.length > 1 ? (
          <OptionGroup label={s.whichPet} value={petId || undefined} onChange={setPetId} options={editable.map((p) => ({ value: p.id, label: p.name }))} />
        ) : null}
        {type === 'vet' ? (
          <Button label={s.continue} block disabled={!pet} onClick={() => { setType(null); navigate(`/pets/${petId}/saude/novo?tipo=vet_visit`); }} />
        ) : type ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!pet) return;
              try {
                await log.mutateAsync({ petId: pet.id, type, notes: notes.slice(0, 120) });
                toast(s.registered(CARE[type].label, pet.name));
                setType(null);
              } catch (err) {
                feedback(err);
              }
            }}
          >
            <TextField label={s.notes} value={notes} maxLength={120} onChange={(e) => setNotes(e.target.value)} placeholder={type === 'medication' ? s.notesPlaceholderMed : s.notesPlaceholder} />
            <p className="mb-4 text-small text-textMuted">{s.willRegister(clock(new Date().toISOString()))}</p>
            <Button type="submit" label={log.isPending ? t.routineForm.saving : s.register} icon="check" block disabled={!pet || log.isPending} />
          </form>
        ) : null}
      </Sheet>
    </section>
  );
}

/** Linha do histórico: "08:12 · Ana (Tutor) deu comida · Thor". */
function FeedItem({ log, pet, showPet, showDate }: { log: CareLog; pet: PetWithWeight | undefined; showPet?: boolean; showDate?: boolean }) {
  const who = useWho();
  const role = roleOf(pet, log.done_by);
  return (
    <li className="flex items-start gap-3 py-[10px]">
      <span className="w-[42px] shrink-0 pt-[5px] text-tiny font-extrabold text-textMuted">{clock(log.done_at)}</span>
      <Avatar name={who(log)} />
      <span className="min-w-0 flex-1 text-small">
        <b>{who(log)}</b>
        {role ? <RoleTag role={role} /> : null} {log.type === 'custom' ? `${CARE.custom.verb}: ${log.title}` : CARE[log.type].verb}
        {showPet && pet ? ` · ${pet.name}` : ''}
        {log.notes || showDate ? (
          <span className="block text-tiny text-textMuted">{[showDate ? dateShort(todayIso(new Date(log.done_at))) : '', log.notes ?? ''].filter(Boolean).join(' · ')}</span>
        ) : null}
      </span>
    </li>
  );
}

/** "Atividade da família hoje" no Início. */
export function CareFeed({ logs, pets }: { logs: CareLog[]; pets: PetWithWeight[] }) {
  const today = logs.filter((l) => todayIso(new Date(l.done_at)) === todayIso() && pets.some((p) => p.id === l.pet_id)).slice(0, 12);
  return (
    <section>
      <h2 className="mb-[10px] text-title font-black text-heading">
        {s.feedTitle} <span className="ml-1 rounded-full bg-surfaceAlt px-2 py-[2px] align-middle text-tiny font-extrabold text-textMuted">{s.feedToday}</span>
      </h2>
      {today.length ? (
        <Card className="py-1">
          <ul className="divide-y divide-line">{today.map((l) => <FeedItem key={l.id} log={l} pet={pets.find((p) => p.id === l.pet_id)} showPet={pets.length > 1} />)}</ul>
        </Card>
      ) : (
        <p className="text-small text-textMuted">{s.feedEmpty}</p>
      )}
    </section>
  );
}

/** Aba "Rotina" do perfil do pet: rotinas cadastradas e últimos cuidados. */
export function RoutineSection({ pet }: { pet: PetWithWeight }) {
  const navigate = useNavigate();
  const { data: routines, isLoading, isError, refetch } = useRoutines();
  const { data: history } = usePetLogs(pet.id);
  const mine = (routines ?? []).filter((r) => r.pet_id === pet.id);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-title font-black text-heading">{s.routineTitle}</h3>
        {pet.canEdit ? (
          <Link to={`/pets/${pet.id}/rotina/nova`} className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-accent px-[14px] text-small font-extrabold text-onAccent">
            <Icon name="plus" size={18} /> {s.routineNew}
          </Link>
        ) : null}
      </div>
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-surfaceAlt" role="status" aria-label={t.auth.loading} />
      ) : isError ? (
        <Card className="text-center"><p className="mb-3 text-textMuted">{s.loadError}</p><Button label={t.admin.retry} onClick={() => void refetch()} /></Card>
      ) : mine.length ? (
        <div className="flex flex-col gap-[10px]">
          {mine.map((r) => {
            const body = (
              <>
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-surfaceAlt text-accent"><Icon name={CARE[r.type].icon} /></span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-text">{r.title}</b>
                  <span className="block text-[13.5px] text-textMuted">{[r.times.map(hm).join(' · '), daysText(r.days), r.active ? '' : s.paused].filter(Boolean).join(' · ')}</span>
                </span>
              </>
            );
            const cls = `flex items-center gap-3 rounded-lg bg-surface p-3 shadow-card ${r.active ? '' : 'opacity-60'}`;
            return pet.canEdit ? (
              <Link key={r.id} to={`/pets/${pet.id}/rotina/${r.id}`} className={cls}>{body}<Icon name="chevR" size={20} className="text-textMuted" /></Link>
            ) : (
              <div key={r.id} className={cls}>{body}</div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="clock" title={s.routineEmptyTitle} text={s.routineEmptyText} actionLabel={pet.canEdit ? s.createRoutine : undefined} onAction={() => navigate(`/pets/${pet.id}/rotina/nova`)} />
      )}
      <h3 className="mt-2 text-title font-black text-heading">{s.history}</h3>
      {history?.length ? (
        <Card className="py-1"><ul className="divide-y divide-line">{history.map((l) => <FeedItem key={l.id} log={l} pet={pet} showDate />)}</ul></Card>
      ) : (
        <p className="text-small text-textMuted">{s.historyEmpty}</p>
      )}
    </section>
  );
}
