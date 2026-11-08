import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InstallSheet } from '@/components/InstallSheet';
import { Button, EmptyState, RoleTag } from '@/components/ui';

describe('Button', () => {
  it('mostra o texto e responde ao toque', async () => {
    const onClick = vi.fn();
    render(<Button label="Cadastrar pet" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar pet' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('não responde quando desabilitado', async () => {
    const onClick = vi.fn();
    render(<Button label="Salvar" onClick={onClick} disabled />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('mostra título, texto e ação', async () => {
    const onAction = vi.fn();
    render(<EmptyState icon="paw" title="Nenhum pet ainda" text="Cadastre seu cão ou gato." actionLabel="Cadastrar pet" onAction={onAction} />);
    expect(screen.getByText('Nenhum pet ainda')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar pet' }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('RoleTag', () => {
  it('mostra Tutor e Convidado', () => {
    render(<><RoleTag role="tutor" /><RoleTag role="guest" /></>);
    expect(screen.getByText('Tutor')).toBeInTheDocument();
    expect(screen.getByText('Convidado')).toBeInTheDocument();
  });
});

describe('InstallSheet', () => {
  it('dentro do Instagram/WhatsApp, manda abrir no navegador', () => {
    render(<InstallSheet open onClose={() => {}} platform="inapp" />);
    expect(screen.getByRole('dialog', { name: 'Instalar o app' })).toBeInTheDocument();
    expect(screen.getByText(/Por aqui não dá para instalar/)).toBeInTheDocument();
    expect(screen.getByText('Abrir no navegador')).toBeInTheDocument();
  });
  it('no iPhone, mostra Adicionar à Tela de Início', () => {
    render(<InstallSheet open onClose={() => {}} platform="ios" />);
    expect(screen.getByText('Adicionar à Tela de Início')).toBeInTheDocument();
  });
  it('fecha pelo botão X', async () => {
    const onClose = vi.fn();
    render(<InstallSheet open onClose={onClose} platform="android" />);
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
