import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { AppLayout } from '@/components/Layout';
import Booklet from '@/pages/Booklet';
import Home from '@/pages/Home';
import Pets from '@/pages/Pets';
import Places from '@/pages/Places';
import Profile from '@/pages/Profile';
import Reminders from '@/pages/Reminders';

// Rotas com "#" (ex.: /#/pets): funcionam em qualquer hospedagem, inclusive
// no endereço de teste e na Hostinger, sem configuração extra no servidor.
const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/pets', element: <Pets /> },
      { path: '/caderneta', element: <Booklet /> },
      { path: '/lembretes', element: <Reminders /> },
      { path: '/locais', element: <Places /> },
    ],
  },
  { path: '/perfil', element: <div className="mx-auto min-h-screen max-w-app bg-background"><Profile /></div> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
