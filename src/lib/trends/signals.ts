import { tokens, bigrams } from "@/lib/text";

/**
 * Sinais quantitativos de tendência a partir dos títulos/legendas coletados:
 * compara a frequência de termos nas últimas `recentHours` com o período anterior.
 */
export interface SignalDoc {
  id: string;
  text: string;
  publishedAt: Date;
  channelKey: string;
  views: number | null;
}

export interface TermSignal {
  term: string;
  recentCount: number;
  priorCount: number;
  recentRatePerDay: number;
  priorRatePerDay: number;
  growth: number;
  distinctCreators: number;
  totalViews: number;
  suggestedStatus: "emergente" | "em_crescimento" | "em_alta" | "saturada";
  docIds: string[];
}

export function suggestStatus(distinctCreators: number, growth: number): TermSignal["suggestedStatus"] {
  if (distinctCreators >= 10 && growth < 1.2) return "saturada";
  if (distinctCreators >= 6) return growth >= 1.5 ? "em_alta" : "saturada";
  if (distinctCreators >= 3 && growth >= 1.5) return "em_crescimento";
  return "emergente";
}

export function termSignals(
  docs: SignalDoc[],
  opts: { now?: Date; recentHours?: number; totalHours?: number; minCreators?: number; limit?: number } = {},
): TermSignal[] {
  const now = opts.now ?? new Date();
  const recentHours = opts.recentHours ?? 48;
  const totalHours = opts.totalHours ?? 168;
  const minCreators = opts.minCreators ?? 2;
  const priorHours = Math.max(1, totalHours - recentHours);

  const stats = new Map<string, { recent: number; prior: number; creators: Set<string>; views: number; docs: Set<string> }>();
  for (const d of docs) {
    const age = (now.getTime() - d.publishedAt.getTime()) / 3_600_000;
    if (age < 0 || age > totalHours) continue;
    const toks = tokens(d.text);
    const terms = new Set([...toks, ...bigrams(toks)]);
    for (const term of terms) {
      let s = stats.get(term);
      if (!s) stats.set(term, (s = { recent: 0, prior: 0, creators: new Set(), views: 0, docs: new Set() }));
      if (age <= recentHours) s.recent++;
      else s.prior++;
      s.creators.add(d.channelKey);
      s.views += d.views ?? 0;
      s.docs.add(d.id);
    }
  }

  const out: TermSignal[] = [];
  for (const [term, s] of stats) {
    if (s.creators.size < minCreators || s.recent === 0) continue;
    const recentRate = (s.recent / recentHours) * 24;
    const priorRate = (s.prior / priorHours) * 24;
    const growth = (recentRate + 0.5) / (priorRate + 0.5);
    out.push({
      term,
      recentCount: s.recent,
      priorCount: s.prior,
      recentRatePerDay: Math.round(recentRate * 100) / 100,
      priorRatePerDay: Math.round(priorRate * 100) / 100,
      growth: Math.round(growth * 100) / 100,
      distinctCreators: s.creators.size,
      totalViews: s.views,
      suggestedStatus: suggestStatus(s.creators.size, growth),
      docIds: [...s.docs].slice(0, 12),
    });
  }
  // remove unigramas totalmente contidos em um bigrama com a mesma cobertura
  const bigramTerms = out.filter((t) => t.term.includes(" "));
  const filtered = out.filter(
    (t) => t.term.includes(" ") || !bigramTerms.some((b) => b.term.split(" ").includes(t.term) && b.distinctCreators === t.distinctCreators),
  );
  return filtered
    .sort((a, b) => b.distinctCreators * b.growth - a.distinctCreators * a.growth || b.totalViews - a.totalViews)
    .slice(0, opts.limit ?? 40);
}
