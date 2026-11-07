"use client";
import { useActionState, useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, Copy, Loader2, Play, Sparkles } from "lucide-react";

type Result = { ok: boolean; message: string };

/** Botão que executa uma server action e mostra o resultado. */
export function ActionButton({
  action, children, className = "btn-ghost", confirm: confirmText, title,
}: { action: () => Promise<Result>; children: ReactNode; className?: string; confirm?: string; title?: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<Result | null>(null);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        title={title}
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            const r = await action();
            setRes(r);
            router.refresh();
          });
        }}
      >
        {pending && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
      {res && <span className={clsx("text-xs", res.ok ? "text-green-300" : "text-amber-300")}>{res.message}</span>}
    </span>
  );
}

/** Formulário ligado a uma server action com estado de resultado. */
export function ActionForm({
  action, children, className, submitLabel = "Salvar", resetOnSuccess,
}: {
  action: (prev: Result | null, fd: FormData) => Promise<Result>;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      if (resetOnSuccess) setKey((k) => k + 1);
    }
  }, [state, router, resetOnSuccess]);
  return (
    <form key={key} action={formAction} className={className}>
      {children}
      <div className="mt-4 flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>
          {pending && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
        {state && <span className={clsx("text-sm", state.ok ? "text-green-300" : "text-amber-300")}>{state.message}</span>}
      </div>
    </form>
  );
}

export function CopyButton({ text, label = "Copiar roteiro" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
      {done ? "Copiado" : label}
    </button>
  );
}

/** Dispara a rotina manualmente e acompanha o progresso. */
export function RunPipelineButton() {
  const [state, setState] = useState<{ status: string; stage?: string; error?: string } | null>(null);
  const router = useRouter();

  async function poll(id: string) {
    for (let i = 0; i < 400; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const r = await fetch(`/api/pipeline/status?id=${id}`, { cache: "no-store" });
      const j = await r.json();
      const stages = (j?.stages ?? []) as { name: string }[];
      setState({ status: j?.status, stage: stages[stages.length - 1]?.name });
      if (j?.status && j.status !== "executando") {
        router.refresh();
        return;
      }
    }
  }

  async function run() {
    setState({ status: "iniciando" });
    const r = await fetch("/api/pipeline/run", { method: "POST" });
    const j = await r.json();
    if (!r.ok) {
      setState({ status: "erro", error: j.error });
      return;
    }
    setState({ status: "executando" });
    poll(j.runId);
  }

  const running = state?.status === "executando" || state?.status === "iniciando";
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button className="btn-primary" onClick={run} disabled={running}>
        {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        {running ? "Executando..." : "Executar análise agora"}
      </button>
      {state && (
        <span className="text-xs text-ink-400">
          {state.error ? <span className="text-amber-300">{state.error}</span> : `${state.status}${state.stage ? ` · ${state.stage.replace(/_/g, " ")}` : ""}`}
        </span>
      )}
    </span>
  );
}

export function AnalyzeButton({ videoId, hasAnalysis }: { videoId: string; hasAnalysis?: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await fetch(`/api/videos/${videoId}/analyze`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ force: Boolean(hasAnalysis) }),
            });
            const j = await r.json();
            if (!r.ok) setErr(j.error ?? "falha");
            else router.push(`/analise/${videoId}`);
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {pending ? "Analisando..." : hasAnalysis ? "Reanalisar com IA" : "Analisar vídeo com IA"}
      </button>
      {err && <span className="text-xs text-amber-300">{err}</span>}
    </span>
  );
}

export function SyncPerformanceButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        className="btn-ghost"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await fetch("/api/performance/sync", { method: "POST" });
            const j = await r.json();
            setMsg(!r.ok ? j.error : j.sync.ok ? `${j.sync.publications} publicações sincronizadas` : j.sync.reason);
            router.refresh();
          })
        }
      >
        {pending && <Loader2 size={14} className="animate-spin" />}
        Sincronizar com Instagram
      </button>
      {msg && <span className="max-w-xs text-right text-xs text-ink-400">{msg}</span>}
    </span>
  );
}
