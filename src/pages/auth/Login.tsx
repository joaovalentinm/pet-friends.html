import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';

import { FormError, PasswordField, TextField } from '@/components/form';
import { Button } from '@/components/ui';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { authErrorMessage, signIn } from '@/features/auth/services';
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
      <p className="mt-5 text-center text-small text-textMuted">
        {s.noAccount} <Link to="/cadastro" className="font-extrabold text-primary">{s.createAccount}</Link>
      </p>
    </AuthLayout>
  );
}
