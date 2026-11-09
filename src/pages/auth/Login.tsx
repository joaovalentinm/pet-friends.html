import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';

import { FormError, PasswordField, TextField } from '@/components/form';
import { toast } from '@/components/Toast';
import { Button } from '@/components/ui';
import { env } from '@/config/env';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { authErrorMessage, signIn, signInWithGoogle } from '@/features/auth/services';
import { t } from '@/i18n/strings';
import { AuthLayout } from './AuthLayout';

const s = t.auth;

export default function Login() {
  const [params] = useSearchParams();
  const [error, setError] = useState(params.get('erro') === 'link' ? s.linkExpired : '');
  const { register, handleSubmit, formState } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    const { error: e } = await signIn(values);
    if (e) setError(authErrorMessage(e));
  });

  const google = async () => {
    if (!env.googleLoginEnabled) return toast(s.googleSoon);
    const { error: e } = await signInWithGoogle();
    if (e) setError(authErrorMessage(e));
  };

  return (
    <AuthLayout title={s.loginTitle} subtitle={s.loginSubtitle}>
      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />
        <TextField label={s.email} type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com" error={formState.errors.email?.message} {...register('email')} />
        <PasswordField label={s.password} autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
        <div className="-mt-1 mb-4 text-right">
          <Link to="/recuperar-senha" className="text-small font-extrabold text-primary">{s.forgot}</Link>
        </div>
        <Button type="submit" label={formState.isSubmitting ? s.entering : s.enter} block disabled={formState.isSubmitting} />
      </form>
      <div className="my-4 flex items-center gap-3 text-small text-textMuted">
        <span className="h-px flex-1 bg-line" />{s.or}<span className="h-px flex-1 bg-line" />
      </div>
      <button type="button" onClick={google} className="flex min-h-[48px] w-full items-center justify-center gap-[10px] rounded-full bg-surface font-extrabold text-text shadow-[inset_0_0_0_1.5px_theme(colors.line)]">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z" /><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" /></svg>
        {s.google}
      </button>
      <p className="mt-5 text-center text-small text-textMuted">
        {s.noAccount} <Link to="/cadastro" className="font-extrabold text-primary">{s.createAccount}</Link>
      </p>
    </AuthLayout>
  );
}
