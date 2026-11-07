const STOPWORDS = new Set(
  (
    "a o e é de da do das dos em no na nos nas um uma uns umas para pra por com sem que se seu sua seus suas " +
    "como mais menos muito muita isso esse essa este esta ele ela eles elas você voce vocês voces eu meu minha " +
    "ao aos à às ou já ja não nao sim tem ter foi ser são sao está esta estão estao vai vão vao the a an and or of to in on " +
    "for with is are was were be this that it its you your how what why when who my we our i at by from as not do does " +
    "can will just new vs top shorts short reels video vídeo videos vídeos #shorts"
  ).split(/\s+/),
);

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalize(s: string): string {
  return stripAccents(s.toLowerCase())
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#@]\w+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

export function bigrams(toks: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < toks.length - 1; i++) out.push(`${toks[i]} ${toks[i + 1]}`);
  return out;
}

export function jaccard(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

export function slugify(s: string): string {
  return normalize(s).replace(/\s+/g, "-").slice(0, 80);
}
