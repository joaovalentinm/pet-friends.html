import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  config: "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.",
  acesso: "Este e-mail não tem acesso. Peça para incluí-lo em ALLOWED_EMAILS.",
  link: "Link de acesso inválido ou expirado.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; next?: string }> }) {
  const sp = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent text-sm font-bold text-ink-950">JCI</div>
          <h1 className="text-lg font-semibold text-white">João Content Intelligence</h1>
          <p className="mt-1 text-sm text-ink-400">Departamento de inteligência de conteúdo</p>
        </div>
        {sp.erro && ERRORS[sp.erro] && (
          <div className="mb-4 rounded-lg border border-red-900/60 bg-red-500/5 px-3 py-2 text-sm text-red-200">{ERRORS[sp.erro]}</div>
        )}
        {configured ? <LoginForm next={sp.next ?? "/"} /> : null}
      </div>
    </div>
  );
}
