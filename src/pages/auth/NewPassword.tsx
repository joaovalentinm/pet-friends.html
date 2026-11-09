import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { FormError, PasswordField } from '@/components/form';
import { toast } from '@/components/Toast';
import { Button } from '@/components/ui';
import { newPasswordSchema, type NewPasswordInput } from '@/features/auth/schemas';
import { authErrorMessage, updatePassword } from '@/features/auth/services';
import { t } from '@/i18n/strings';
import { useAuth } from '@/stores/auth';
import { AuthLayout } from './AuthLayout';

const s = t.auth;

export default function NewPassword() {
  const navigate = useNavigate();
  const setRecovery = useAuth((st) => st.setRecovery);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    setError('');
    const { error: e } = await updatePassword(password);
    if (e) return setError(authErrorMessage(e));
    setRecovery(false);
    toast(s.passwordChanged);
    navigate('/', { replace: true });
  });

  return (
    <AuthLayout title={s.newPasswordTitle} subtitle={s.newPasswordSubtitle}>
      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />
        <PasswordField label={s.newPassword} autoComplete="new-password" hint={s.passwordHint} error={formState.errors.password?.message} {...register('password')} />
        <PasswordField label={s.confirmPassword} autoComplete="new-password" error={formState.errors.confirm?.message} {...register('confirm')} />
        <Button type="submit" label={formState.isSubmitting ? s.saving : s.savePassword} block disabled={formState.isSubmitting} />
      </form>
    </AuthLayout>
  );
}
