import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { loginSchema, newPasswordSchema, signupSchema } from '@/features/auth/schemas';
import { authErrorMessage } from '@/features/auth/services';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';

describe('regras de senha e cadastro', () => {
  const ok = { fullName: 'Ana Souza', email: 'ana@email.com', password: 'cachorro123', acceptTerms: true };
  it('aceita um cadastro válido', () => expect(signupSchema.safeParse(ok).success).toBe(true));
  it('recusa senha curta', () => expect(signupSchema.safeParse({ ...ok, password: 'abc12' }).success).toBe(false));
  it('recusa senha sem número', () => expect(signupSchema.safeParse({ ...ok, password: 'somenteletras' }).success).toBe(false));
  it('exige aceitar os termos', () => expect(signupSchema.safeParse({ ...ok, acceptTerms: false }).success).toBe(false));
  it('recusa e-mail inválido no login', () => expect(loginSchema.safeParse({ email: 'ana@', password: 'x' }).success).toBe(false));
  it('nova senha precisa ser repetida igual', () =>
    expect(newPasswordSchema.safeParse({ password: 'cachorro123', confirm: 'cachorro124' }).success).toBe(false));
});

describe('mensagens de erro em português', () => {
  it('senha errada', () => expect(authErrorMessage(Object.assign(new Error('Invalid login credentials'), { code: 'invalid_credentials' }))).toBe('E-mail ou senha incorretos.'));
  it('e-mail não confirmado', () => expect(authErrorMessage(Object.assign(new Error('Email not confirmed'), { code: 'email_not_confirmed' }))).toMatch(/confirmar seu e-mail/));
});

describe('tela Entrar', () => {
  it('mostra e-mail, senha, esqueci a senha e criar conta (sem Google)', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar conta' })).toBeInTheDocument();
  });
  it('avisa quando os campos estão vazios', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
  });
});

describe('tela Criar conta', () => {
  it('não deixa criar conta sem aceitar os termos', async () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Ana');
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@email.com');
    await userEvent.type(screen.getByLabelText('Crie uma senha para o Pet Friends'), 'cachorro123');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByText(/aceite os Termos/)).toBeInTheDocument();
  });
});
