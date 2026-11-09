import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { PublicOnly, RequireAuth } from '@/components/AuthGate';
import { AppLayout } from '@/components/Layout';
import { toast } from '@/components/Toast';
import { t } from '@/i18n/strings';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import Login from '@/pages/auth/Login';
import NewPassword from '@/pages/auth/NewPassword';
import Signup from '@/pages/auth/Signup';
import Admin from '@/pages/Admin';
import Booklet from '@/pages/Booklet';
import Home from '@/pages/Home';
import Pets from '@/pages/Pets';
import PetDetail from '@/pages/pets/PetDetail';
import PetForm from '@/pages/pets/PetForm';
import HealthForm from '@/pages/health/HealthForm';
import RoutineForm from '@/pages/care/RoutineForm';
import Places from '@/pages/Places';
import Privacy from '@/pages/Privacy';
import Profile from '@/pages/Profile';
import Reminders from '@/pages/Reminders';
import { supabase } from '@/services/supabase';
import { startAuth, useAuth } from '@/stores/auth';
import { startAutoUpdate } from '@/pwa/update';

/**
 * Os links de e-mail do Supabase (confirmar conta, nova senha) voltam com
 * "#access_token=..." ou "#error=..." no endereço. Como as rotas usam "#", tratamos
 * isso ANTES de montar as rotas e depois limpamos o endereço.
 */
async function handleAuthRedirect() {
  const hash = window.location.hash.slice(1);
  if (!hash.includes('access_token=') && !hash.includes('error=')) return;
  const p = new URLSearchParams(hash);
  if (p.get('error')) {
    window.location.hash = '#/entrar?erro=link';
    return;
  }
  const type = p.get('type');
  await supabase.auth.getSession(); // o Supabase lê o token do endereço e cria a sessão
  if (type === 'recovery') {
    useAuth.getState().setRecovery(true);
    window.location.hash = '#/nova-senha';
  } else {
    if (type === 'signup') setTimeout(() => toast(t.auth.emailConfirmed), 300);
    window.location.hash = '#/';
  }
}

const app = (el: React.ReactNode) => <RequireAuth>{el}</RequireAuth>;
const pub = (el: React.ReactNode) => <PublicOnly>{el}</PublicOnly>;

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } } });

async function main() {
  await handleAuthRedirect();
  startAuth();
  startAutoUpdate();

  const router = createHashRouter([
    {
      element: app(<AppLayout />),
      children: [
        { path: '/', element: <Home /> },
        { path: '/pets', element: <Pets /> },
        { path: '/caderneta', element: <Booklet /> },
        { path: '/lembretes', element: <Reminders /> },
        { path: '/locais', element: <Places /> },
      ],
    },
    { path: '/perfil', element: app(<div className="mx-auto min-h-screen max-w-app bg-background"><Profile /></div>) },
    { path: '/entrar', element: pub(<Login />) },
    { path: '/cadastro', element: pub(<Signup />) },
    { path: '/recuperar-senha', element: pub(<ForgotPassword />) },
    { path: '/nova-senha', element: app(<NewPassword />) },
    { path: '/privacidade', element: <Privacy /> },
    { path: '/painel', element: app(<Admin />) },
    { path: '/pets/novo', element: app(<PetForm />) },
    { path: '/pets/:petId', element: app(<PetDetail />) },
    { path: '/pets/:petId/editar', element: app(<PetForm />) },
    { path: '/pets/:petId/saude/novo', element: app(<HealthForm />) },
    { path: '/pets/:petId/saude/:recordId', element: app(<HealthForm />) },
    { path: '/pets/:petId/rotina/nova', element: app(<RoutineForm />) },
    { path: '/pets/:petId/rotina/:routineId', element: app(<RoutineForm />) },
    { path: '*', element: app(<AppLayout />) },
  ]);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void main();
