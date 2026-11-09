import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Card, IconButton } from '@/components/ui';
import { fetchAdminStats, type AdminStats } from '@/features/admin/services';
import { t } from '@/i18n/strings';

const a = t.admin;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface p-[14px] shadow-card">
      <b className="block text-[26px] font-black leading-tight text-heading">{value}</b>
      <span className="text-tiny font-bold text-textMuted">{label}</span>
    </div>
  );
}

/** Gráfico de barras simples (SVG), com o número em cima de cada barra. */
function Bars({ title, values, labels, color }: { title: string; values: number[]; labels: string[]; color: string }) {
  const max = Math.max(1, ...values);
  const W = 320;
  const H = 150;
  const bw = W / values.length;
  return (
    <Card>
      <h3 className="mb-2 text-small font-extrabold text-heading">{title}</h3>
      <svg viewBox={`0 0 ${W} ${H + 34}`} className="w-full" role="img" aria-label={`${title}: ${values.join(', ')}`}>
        {values.map((v, i) => {
          const h = Math.round((v / max) * H);
          const x = i * bw + 6;
          return (
            <g key={labels[i]}>
              <rect x={x} y={H - h + 14} width={bw - 12} height={Math.max(h, 2)} rx={6} fill={color} />
              <text x={x + (bw - 12) / 2} y={H - h + 9} textAnchor="middle" fontSize="11" fontWeight="800" fill="#14532D">{v}</text>
              <text x={x + (bw - 12) / 2} y={H + 30} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6B7280">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}

const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetchAdminStats()
      .then((s) => {
        setError('');
        setStats(s);
      })
      .catch((e: unknown) => {
        const code = (e as { code?: string }).code;
        setError(code === '42501' ? a.denied : a.error);
      });
  }, []);

  useEffect(load, [load]);

  return (
    <div className="mx-auto min-h-screen max-w-app bg-background">
      <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <IconButton icon="chevL" label={t.profile.back} onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-h1 font-black text-heading">{a.title}</h1>
      </header>
      <main className="flex flex-col gap-4 px-screen pb-10">
        {error ? (
          <Card className="text-center">
            <p className="mb-3 text-textMuted">{error}</p>
            {error === a.error ? <Button label={a.retry} onClick={load} /> : null}
          </Card>
        ) : !stats ? (
          <p role="status" className="text-textMuted">{a.loading}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label={a.totalUsers} value={stats.total_users} />
              <Stat label={a.newUsers} value={stats.new_users_7d} />
              <Stat label={a.activeUsers} value={stats.active_users_7d} />
              <Stat label={a.minutes} value={stats.minutes_7d} />
              <Stat label={a.avgMinutes} value={String(stats.avg_minutes_per_active_7d).replace('.', ',')} />
              <Stat label={a.pets} value={stats.pets_total} />
            </div>
            <h2 className="mt-2 text-title font-black text-heading">{a.weeksTitle}</h2>
            <Bars title={a.weeksActive} values={stats.weeks.map((w) => w.active_users)} labels={stats.weeks.map((w) => shortDate(w.week_start))} color="#16A34A" />
            <Bars title={a.weeksMinutes} values={stats.weeks.map((w) => w.minutes)} labels={stats.weeks.map((w) => shortDate(w.week_start))} color="#F97316" />
            <p className="text-tiny text-textMuted">{a.privacyNote}</p>
          </>
        )}
      </main>
    </div>
  );
}
