import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { FormError, TextField } from '@/components/form';
import { Button } from '@/components/ui';
import { forgotSchema, type ForgotInput } from '@/features/auth/schemas';
import { authErrorMessage, sendPasswordReset } from '@/features/auth/services';
import { t } from '@/i18n/strings';
import { AuthLayout } from './AuthLayout';

const s = t.auth;

export default function ForgotPassword() {
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError('');
    const { error: e } = await sendPasswordReset(email);
    // Mensagem neutra: não revela se o e-mail tem conta (segurança).
    if (e && 'status' in e && e.status === 429) return setError(authErrorMessage(e));
    setSent(true);
  });

  if (sent) {
    return (
      <AuthLayout title={s.resetSentTitle} subtitle={s.resetSentText}>
        <Link to="/entrar" className="flex min-h-[48px] items-center justify-center rounded-full bg-accent font-extrabold text-onAccent">{s.backToLogin}</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={s.forgotTitle} subtitle={s.forgotSubtitle}>
      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />
        <TextField label={s.email} type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com" error={formState.errors.email?.message} {...register('email')} />
        <Button type="submit" label={formState.isSubmitting ? s.sending : s.sendLink} block disabled={formState.isSubmitting} />
      </form>
      <p className="mt-5 text-center text-small">
        <Link to="/entrar" className="font-extrabold text-primary">{s.backToLogin}</Link>
      </p>
    </AuthLayout>
  );
}
