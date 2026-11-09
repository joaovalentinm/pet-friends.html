import type { ReactNode } from 'react';

import { avatarColor, initial } from '@/utils/avatar';
import { Icon, type IconName } from './Icon';

/* ---------- Button ---------- */
type Variant = 'accent' | 'primary' | 'ghost' | 'soft' | 'danger';
const variants: Record<Variant, string> = {
  accent: 'bg-accent text-onAccent',
  primary: 'bg-primary text-onPrimary',
  ghost: 'bg-transparent text-heading shadow-[inset_0_0_0_2px_theme(colors.primary)]',
  soft: 'bg-surfaceAlt text-heading',
  danger: 'bg-transparent text-warnInk shadow-[inset_0_0_0_2px_theme(colors.warnInk)]',
};

type ButtonProps = {
  label: string;
  onClick?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: IconName;
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
};

/** Botão em pílula do protótipo. Uma ação "accent" (laranja) por tela. */
export function Button({ label, onClick, variant = 'accent', size = 'md', icon, block, disabled, type = 'button' }: ButtonProps) {
  const sz = size === 'sm' ? 'min-h-[38px] px-[14px] text-small' : 'min-h-[48px] px-[22px] text-button';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-transform active:scale-[.97] disabled:opacity-50 ${sz} ${variants[variant]} ${block ? 'w-full' : ''}`}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 20} /> : null}
      {label}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-surface p-4 shadow-card ${className}`}>{children}</div>;
}

/* ---------- Badge e RoleTag ---------- */
type Tone = 'done' | 'warn' | 'info';
const tones: Record<Tone, string> = {
  done: 'bg-doneBg text-doneInk',
  warn: 'bg-warnBg text-warnInk',
  info: 'bg-infoBg text-heading',
};
export function Badge({ label, tone = 'info' }: { label: string; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-full px-[10px] py-1 text-tiny font-extrabold ${tones[tone]}`}>{label}</span>;
}
/** Etiqueta "Tutor" / "Convidado" exibida ao lado dos nomes. */
export function RoleTag({ role }: { role: 'tutor' | 'guest' }) {
  const tutor = role === 'tutor';
  return (
    <span className={`ml-1 inline-flex rounded-full px-2 py-[1px] align-[2px] text-[11px] font-extrabold ${tutor ? 'bg-doneBg text-doneInk' : 'bg-warnBg text-warnInk'}`}>
      {tutor ? 'Tutor' : 'Convidado'}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full font-black text-white"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: Math.round(size * 0.42) }}
    >
      {initial(name)}
    </span>
  );
}

/* ---------- EmptyState ---------- */
type EmptyProps = { icon: IconName; title: string; text: string; actionLabel?: string; onAction?: () => void };
export function EmptyState({ icon, title, text, actionLabel, onAction }: EmptyProps) {
  return (
    <Card className="px-[18px] py-7 text-center">
      <span className="text-accent">
        <Icon name={icon} size={44} className="mx-auto" />
      </span>
      <h3 className="mb-1 mt-[10px] text-title font-black text-heading">{title}</h3>
      <p className="mb-4 text-textMuted">{text}</p>
      {actionLabel ? <Button label={actionLabel} icon="plus" onClick={onAction} /> : null}
    </Card>
  );
}

/* ---------- Hero com colinas ---------- */
export function Hills({ height = 70 }: { height?: number }) {
  return (
    <svg className="absolute inset-x-0 bottom-0 w-full" style={{ height }} viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 80V52C70 10 170 8 250 50L250 80Z" className="fill-green" />
      <path d="M190 80C240 30 330 18 400 40V80Z" className="fill-orange" />
    </svg>
  );
}
export function Hero({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="relative mt-[6px] overflow-hidden rounded-2xl bg-surfaceAlt px-5 pb-16 pt-5">
      <h2 className="mb-[6px] text-hero font-black text-heading">{title}</h2>
      {text ? <p className="max-w-[30ch] text-textMuted">{text}</p> : null}
      {children}
      <Hills />
    </div>
  );
}

/* ---------- Segmented ---------- */
type Opt<K extends string> = { key: K; label: string };
export function Segmented<K extends string>({ options, value, onChange, label }: { options: readonly Opt<K>[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex gap-[2px] rounded-full bg-surfaceAlt p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={o.key === value}
          onClick={() => onChange(o.key)}
          className={`min-h-[40px] flex-1 rounded-full text-small font-extrabold ${o.key === value ? 'bg-surface text-heading shadow-card' : 'text-textMuted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Botão de ícone (topo) ---------- */
export function IconButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid h-touch w-touch shrink-0 place-items-center rounded-[14px] bg-surface text-heading shadow-card">
      <Icon name={icon} />
    </button>
  );
}
