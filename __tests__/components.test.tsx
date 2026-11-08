import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button, EmptyState, RoleTag } from '@/components/ui';

describe('Button', () => {
  it('mostra o texto e responde ao toque', async () => {
    const onPress = jest.fn();
    await render(<Button label="Cadastrar pet" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar pet' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não responde quando desabilitado', async () => {
    const onPress = jest.fn();
    await render(<Button label="Salvar" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('mostra título, texto e ação', async () => {
    const onAction = jest.fn();
    await render(<EmptyState icon="paw" title="Nenhum pet ainda" text="Cadastre seu cão ou gato." actionLabel="Cadastrar pet" onAction={onAction} />);
    expect(screen.getByText('Nenhum pet ainda')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar pet' }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('RoleTag', () => {
  it('mostra Tutor e Convidado', async () => {
    await render(
      <>
        <RoleTag role="tutor" />
        <RoleTag role="guest" />
      </>,
    );
    expect(screen.getByText('Tutor')).toBeTruthy();
    expect(screen.getByText('Convidado')).toBeTruthy();
  });
});
