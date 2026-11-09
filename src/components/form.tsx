import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

const inputCls =
  'min-h-[48px] w-full rounded-md border-0 bg-surface px-[14px] text-body text-text shadow-[inset_0_0_0_1.5px_theme(colors.line)] outline-none placeholder:text-textMuted focus:shadow-[inset_0_0_0_2px_theme(colors.primary)] focus-visible:outline-none aria-[invalid=true]:shadow-[inset_0_0_0_2px_theme(colors.warnInk)]';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Campo de texto com rótulo, ajuda e mensagem de erro (ligado ao React Hook Form via ref). */
export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField({ label, error, hint, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="mb-[14px] flex flex-col gap-[6px]">
      <label htmlFor={fid} className="text-small font-extrabold text-heading">{label}</label>
      <input ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined} className={inputCls} {...rest} />
      {error ? <p id={`${fid}-err`} role="alert" className="text-[13px] font-bold text-warnInk">{error}</p> : hint ? <p id={`${fid}-hint`} className="text-[13px] text-textMuted">{hint}</p> : null}
    </div>
  );
});

/** Campo de senha com botão "Mostrar/Ocultar". */
export const PasswordField = forwardRef<HTMLInputElement, FieldProps>(function PasswordField({ label, error, hint, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  const [show, setShow] = useState(false);
  return (
    <div className="mb-[14px] flex flex-col gap-[6px]">
      <label htmlFor={fid} className="text-small font-extrabold text-heading">{label}</label>
      <div className="relative">
        <input ref={ref} id={fid} type={show ? 'text' : 'password'} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined} className={`${inputCls} pr-[84px]`} {...rest} />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 min-h-[40px] -translate-y-1/2 rounded-full px-3 text-small font-extrabold text-primary" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {error ? <p id={`${fid}-err`} role="alert" className="text-[13px] font-bold text-warnInk">{error}</p> : hint ? <p id={`${fid}-hint`} className="text-[13px] text-textMuted">{hint}</p> : null}
    </div>
  );
});

type CheckProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string };

export const Checkbox = forwardRef<HTMLInputElement, CheckProps>(function Checkbox({ label, error, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="mb-[14px]">
      <div className="flex items-start gap-3">
        <input ref={ref} id={fid} type="checkbox" aria-invalid={!!error} className="mt-[2px] h-6 w-6 shrink-0 accent-primary" {...rest} />
        <label htmlFor={fid} className="text-small text-text">{label}</label>
      </div>
      {error ? <p role="alert" className="mt-1 text-[13px] font-bold text-warnInk">{error}</p> : null}
    </div>
  );
});

/** Aviso de erro geral do formulário. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <div role="alert" className="mb-[14px] rounded-lg bg-warnBg p-[14px] text-small font-bold text-warnInk">{message}</div>;
}

type Option<V extends string> = { value: V; label: string };

/** Opções em pílula (como no protótipo), ex.: Cão / Gato. */
export function OptionGroup<V extends string>({ label, options, value, onChange, error }: { label: string; options: Option<V>[]; value: V | undefined; onChange: (v: V) => void; error?: string }) {
  const gid = useId();
  return (
    <fieldset className="mb-[14px]">
      <legend id={gid} className="mb-[6px] text-small font-extrabold text-heading">{label}</legend>
      <div role="radiogroup" aria-labelledby={gid} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`min-h-[40px] rounded-full px-[14px] text-small font-extrabold ${on ? 'bg-primary text-onPrimary' : 'bg-surface text-textMuted shadow-[inset_0_0_0_1.5px_theme(colors.line)]'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error ? <p role="alert" className="mt-1 text-[13px] font-bold text-warnInk">{error}</p> : null}
    </fieldset>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string };

export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea({ label, error, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="mb-[14px] flex flex-col gap-[6px]">
      <label htmlFor={fid} className="text-small font-extrabold text-heading">{label}</label>
      <textarea ref={ref} id={fid} aria-invalid={!!error} rows={3} className={`${inputCls} py-[10px]`} {...rest} />
      {error ? <p role="alert" className="text-[13px] font-bold text-warnInk">{error}</p> : null}
    </div>
  );
});
