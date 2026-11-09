import { create } from 'zustand';

/** Estado da folha "Instalar o app" (aberta de qualquer tela). */
export const useInstallUi = create<{ open: boolean; setOpen: (v: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
