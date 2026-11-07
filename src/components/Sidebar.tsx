"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import {
  LayoutDashboard, Radar, Trophy, TrendingUp, Users, ScanSearch, Clapperboard, Library, BarChart3, History, Settings, Menu, X,
} from "lucide-react";

export const NAV = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/radar", label: "Radar viral", icon: Radar },
  { href: "/top10", label: "Top 10 do dia", icon: Trophy },
  { href: "/tendencias", label: "Radar de tendências", icon: TrendingUp },
  { href: "/criadores", label: "Criadores monitorados", icon: Users },
  { href: "/analise", label: "Análise de vídeos", icon: ScanSearch },
  { href: "/hoje", label: "O que gravar hoje?", icon: Clapperboard },
  { href: "/roteiros", label: "Biblioteca de roteiros", icon: Library },
  { href: "/desempenho", label: "Meu desempenho", icon: BarChart3 },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ email }: { email: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-700/60 bg-ink-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button className="btn-ghost px-2" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-ink-700/60 bg-ink-950 px-3 py-5 lg:flex",
          open ? "flex" : "hidden",
        )}
      >
        <div className="mb-6 hidden px-2 lg:block">
          <Brand />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
                active(href) ? "bg-ink-800 text-white" : "text-ink-300 hover:bg-ink-900 hover:text-ink-100",
              )}
            >
              <Icon size={16} className={active(href) ? "text-accent" : "text-ink-400"} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-ink-700/60 px-2 pt-4">
          <div className="truncate text-xs text-ink-400">{email}</div>
          <form action="/auth/signout" method="post">
            <button className="mt-2 text-xs text-ink-300 hover:text-white">Sair</button>
          </form>
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-accent text-[11px] font-bold text-ink-950">JCI</div>
      <div className="leading-tight">
        <div className="text-[13px] font-semibold tracking-tight text-white">João Content</div>
        <div className="text-[11px] text-ink-400">Intelligence</div>
      </div>
    </div>
  );
}
