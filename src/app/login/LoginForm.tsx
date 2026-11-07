"use client";
import { useState } from "react";
import { createBrowser } from "@/lib/supabase/browser";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"senha" | "link">("senha");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const supabase = createBrowser();
    if (mode === "senha") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ tone: "err", text: "E-mail ou senha inválidos." });
      else window.location.href = safeNext;
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
      });
      setMsg(error ? { tone: "err", text: "Não foi possível enviar o link. Verifique se o usuário existe no Supabase." } : { tone: "ok", text: "Link de acesso enviado para o seu e-mail." });
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="card card-pad space-y-4">
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {mode === "senha" && (
        <div>
          <label className="label" htmlFor="password">Senha</label>
          <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      )}
      {msg && <p className={msg.tone === "ok" ? "text-sm text-green-300" : "text-sm text-red-300"}>{msg.text}</p>}
      <button className="btn-primary w-full" disabled={loading}>{loading ? "Aguarde..." : mode === "senha" ? "Entrar" : "Enviar link de acesso"}</button>
      <button type="button" className="w-full text-xs text-ink-400 hover:text-ink-200" onClick={() => setMode(mode === "senha" ? "link" : "senha")}>
        {mode === "senha" ? "Entrar com link mágico por e-mail" : "Entrar com senha"}
      </button>
    </form>
  );
}
