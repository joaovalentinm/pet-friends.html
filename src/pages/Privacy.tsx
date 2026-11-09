import { useNavigate } from 'react-router-dom';

import { Card, IconButton } from '@/components/ui';

/**
 * Termos de Uso e Política de Privacidade — VERSÃO PROVISÓRIA 0.1.
 * A versão completa (revisada pelo responsável) entra na Etapa 8 (LGPD).
 */
export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto min-h-screen max-w-app bg-background">
      <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 bg-background px-screen py-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <IconButton icon="chevL" label="Voltar" onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-h1 font-black text-heading">Termos e Privacidade</h1>
      </header>
      <main className="flex flex-col gap-4 px-screen pb-10">
        <p className="text-tiny font-bold text-warnInk">Versão provisória 0.1 · 09/11/2026. A versão completa será publicada antes do lançamento.</p>
        <Card>
          <h2 className="mb-2 text-title font-black text-heading">O que o Pet Friends guarda</h2>
          <ul className="list-disc space-y-1 pl-5 text-small">
            <li>Seu nome e e-mail, para criar sua conta e entrar no app.</li>
            <li>Os dados que você cadastra dos seus pets: nome, espécie, fotos, saúde, cuidados e lembretes.</li>
            <li>O registro de que você aceitou estes termos, com data e versão.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 text-title font-black text-heading">Como protegemos</h2>
          <ul className="list-disc space-y-1 pl-5 text-small">
            <li>Os dados ficam em servidores no Brasil (São Paulo), com acesso protegido: cada pessoa só vê os próprios pets e os pets compartilhados com ela.</li>
            <li>Sua senha é guardada de forma criptografada; nem a equipe consegue vê-la.</li>
            <li>As fotos ficam em pastas privadas, sem link público.</li>
            <li>Não vendemos nem compartilhamos seus dados para publicidade.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 text-title font-black text-heading">Seus direitos (LGPD)</h2>
          <p className="text-small">Você pode pedir para ver, corrigir, exportar ou apagar seus dados. Em breve isso poderá ser feito direto no app (Perfil). O app é gratuito e destinado a tutores de cães e gatos.</p>
        </Card>
      </main>
    </div>
  );
}
