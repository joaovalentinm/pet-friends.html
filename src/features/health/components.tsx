import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '@/components/Icon';
import { Badge } from '@/components/ui';
import { t } from '@/i18n/strings';
import { dateShort, todayIso } from '@/utils/format';
import { HEALTH, HEALTH_TYPES, type HealthType } from './constants';
import { useRecords } from './hooks';
import { isPending, type HealthRecord, type RecordWithDocs } from './services';

const PREVENTIVE: HealthType[] = ['vaccine', 'dewormer', 'flea_tick'];

/** Quantos dias faltam (negativo = atrasado). */
export function daysUntil(iso: string, today = todayIso()): number {
  const [a, b] = [today, iso].map((d) => {
    const [y, m, dd] = d.split('-').map(Number);
    return Date.UTC(y ?? 1970, (m ?? 1) - 1, dd ?? 1);
  });
  return Math.round(((b ?? 0) - (a ?? 0)) / 864e5);
}

export function relDays(iso: string): string {
  const n = daysUntil(iso);
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  if (n === -1) return 'ontem';
  if (n > 1) return n < 45 ? `em ${n} dias` : dateShort(iso);
  return `há ${-n} dias`;
}

/** Linha do registro na linha do tempo. */
export function RecordRow({ record, petId }: { record: RecordWithDocs | HealthRecord; petId: string }) {
  const h = HEALTH[record.type];
  const docs = 'health_documents' in record ? record.health_documents.length : 0;
  const parts = [h.label, dateShort(record.occurred_on)];
  if (isPending(record) && record.next_due_on) parts.push(`próxima ${dateShort(record.next_due_on)}`);
  if (docs) parts.push(`${docs} anexo${docs > 1 ? 's' : ''}`);
  const preventive = PREVENTIVE.includes(record.type);
  return (
    <Link to={`/pets/${petId}/saude/${record.id}`} className="flex items-center gap-3 rounded-lg bg-surface p-3 shadow-card">
      <span className={`grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] ${preventive ? 'bg-surfaceAlt text-accent' : 'bg-infoBg text-primary'}`}>
        <Icon name={h.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-text">{record.title}</b>
        <span className="block text-[13.5px] text-textMuted">{parts.join(' · ')}</span>
      </span>
      <Icon name="chevR" size={20} className="text-textMuted" />
    </Link>
  );
}

/** Seção "Saúde" do perfil do pet: filtros por tipo + linha do tempo. */
export function HealthSection({ petId, canEdit }: { petId: string; canEdit: boolean }) {
  const { data: records, isLoading, isError, refetch } = useRecords(petId);
  const [filter, setFilter] = useState<HealthType | 'all'>('all');
  const list = (records ?? []).filter((r) => filter === 'all' || r.type === filter);
  return (
    <section>
      <div className="mb-[10px] flex items-center justify-between">
        <h3 className="text-title font-black text-heading">{t.health.title}</h3>
        {canEdit ? (
          <Link to={`/pets/${petId}/saude/novo`} className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-accent px-[14px] text-small font-extrabold text-onAccent">
            <Icon name="plus" size={18} /> {t.health.add}
          </Link>
        ) : null}
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {(['all', ...HEALTH_TYPES] as const).map((k) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`min-h-[38px] shrink-0 rounded-full px-[14px] text-small font-extrabold ${filter === k ? 'bg-primary text-onPrimary' : 'bg-surface text-textMuted shadow-[inset_0_0_0_1.5px_theme(colors.line)]'}`}>
            {k === 'all' ? t.health.all : HEALTH[k].plural}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-surfaceAlt" role="status" aria-label={t.auth.loading} />
      ) : isError ? (
        <button type="button" onClick={() => void refetch()} className="text-small font-extrabold text-primary">{t.health.loadError}</button>
      ) : list.length ? (
        <div className="flex flex-col gap-[10px]">{list.map((r) => <RecordRow key={r.id} record={r} petId={petId} />)}</div>
      ) : (
        <div className="rounded-xl bg-surface p-5 text-center shadow-card">
          <span className="text-accent"><Icon name="syringe" size={40} className="mx-auto" /></span>
          <h4 className="mb-1 mt-2 font-black text-heading">{filter === 'all' ? t.health.emptyTitle : t.health.emptyFilter}</h4>
          {filter === 'all' ? <p className="text-small text-textMuted">{t.health.emptyText}</p> : null}
        </div>
      )}
    </section>
  );
}

/** Item de lembrete de saúde (próxima dose). */
export function DueItem({ record, petName, onOpen }: { record: HealthRecord; petName?: string; onOpen: () => void }) {
  const h = HEALTH[record.type];
  const n = record.next_due_on ? daysUntil(record.next_due_on) : 0;
  const label = record.title.toLowerCase() === h.label.toLowerCase() ? record.title : `${h.label}: ${record.title}`;
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-lg bg-surface p-3 text-left shadow-card">
      <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-surfaceAlt text-accent"><Icon name={h.icon} /></span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-text">{label}</b>
        <span className="block text-[13.5px] text-textMuted">{[petName, record.next_due_on ? dateShort(record.next_due_on) : ''].filter(Boolean).join(' · ')}</span>
      </span>
      {n < 0 ? <Badge label={t.reminders.late} tone="warn" /> : n <= 3 ? <Badge label={relDays(record.next_due_on ?? '')} tone="warn" /> : <Badge label={relDays(record.next_due_on ?? '')} tone="info" />}
    </button>
  );
}
