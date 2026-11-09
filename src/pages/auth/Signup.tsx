import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Checkbox, FormError, PasswordField, TextField } from '@/components/form';
import { Button } from '@/components/ui';
import { signupSchema, type SignupInput } from '@/features/auth/schemas';
import { authErrorMessage, signUp } from '@/features/auth/services';
import { t } from '@/i18n/strings';
import { AuthLayout } from './AuthLayout';

const s = t.auth;

export default function Signup() {
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const { register, handleSubmit, formState } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    const { data, error: e } = await signUp(values);
    if (e) return setError(authErrorMessage(e));
    // Sem sessão = o Supabase pede confirmação por e-mail.
    if (!data.session) setSentTo(values.email);
  });

  if (sentTo) {
    return (
      <AuthLayout title={s.checkEmailTitle} subtitle={s.checkEmailText(sentTo)}>
        <p className="mb-4 text-small text-textMuted">{s.checkEmailHint}</p>
        <Link to="/entrar" className="flex min-h-[48px] items-center justify-center rounded-full bg-accent font-extrabold text-onAccent">{s.backToLogin}</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={s.signupTitle} subtitle={s.signupSubtitle}>
      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />
        <TextField label={s.name} autoComplete="name" placeholder={s.namePlaceholder} error={formState.errors.fullName?.message} {...register('fullName')} />
        <TextField label={s.email} type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com" error={formState.errors.email?.message} {...register('email')} />
        <PasswordField label={s.createPassword} autoComplete="new-password" hint={s.passwordHint} error={formState.errors.password?.message} {...register('password')} />
        <Checkbox
          label={<>{s.acceptPrefix} <Link to="/privacidade" className="font-extrabold text-primary underline">{s.acceptLink}</Link>.</>}
          error={formState.errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />
        <Button type="submit" label={formState.isSubmitting ? s.creating : s.createAccount} block disabled={formState.isSubmitting} />
      </form>
      <p className="mt-5 text-center text-small text-textMuted">
        {s.haveAccount} <Link to="/entrar" className="font-extrabold text-primary">{s.enter}</Link>
      </p>
    </AuthLayout>
  );
}
