import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  process.env.YOUTUBE_API_KEY = "test-key";
  process.env.META_ACCESS_TOKEN = "tok";
  process.env.IG_BUSINESS_ACCOUNT_ID = "123";
  vi.resetModules();
});
afterEach(() => vi.unstubAllGlobals());

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("adaptador YouTube", () => {
  it("converte duração ISO 8601", async () => {
    const yt = await import("@/lib/sources/youtube");
    expect(yt.parseIsoDuration("PT45S")).toBe(45);
    expect(yt.parseIsoDuration("PT1M5S")).toBe(65);
    expect(yt.parseIsoDuration("PT1H")).toBe(3600);
    expect(yt.parseIsoDuration(null)).toBeNull();
  });

  it("busca Shorts, marca compartilhamentos como indisponíveis e calcula base do canal", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      calls.push(url);
      const u = new URL(url);
      if (u.pathname.endsWith("/search")) {
        expect(u.searchParams.get("videoDuration")).toBe("short");
        expect(u.searchParams.get("relevanceLanguage")).toBe("pt");
        return json({ items: [{ id: { videoId: "v1" } }] });
      }
      if (u.pathname.endsWith("/videos")) {
        const ids = u.searchParams.get("id")!.split(",");
        return json({
          items: ids.map((id, i) => ({
            id,
            snippet: { publishedAt: "2026-11-06T10:00:00Z", channelId: "c1", title: `Título ${id}`, description: "desc", channelTitle: "Canal", thumbnails: { high: { url: "https://i.ytimg.com/x.jpg" } } },
            statistics: { viewCount: String(id === "v1" ? 400000 : 20000 + i), likeCount: "10", commentCount: "2" },
            contentDetails: { duration: "PT40S" },
          })),
        });
      }
      if (u.pathname.endsWith("/channels")) {
        return json({ items: [{ id: "c1", snippet: { title: "Canal", customUrl: "@canal" }, statistics: { subscriberCount: "50000" }, contentDetails: { relatedPlaylists: { uploads: "UU1" } } }] });
      }
      if (u.pathname.endsWith("/playlistItems")) {
        return json({ items: Array.from({ length: 8 }, (_, i) => ({ contentDetails: { videoId: `u${i}` } })) });
      }
      return json({}, 404);
    });
    const yt = await import("@/lib/sources/youtube");
    const ids = await yt.searchShortIds("IA para empresas", { regionCode: "BR", publishedAfter: "2026-11-01T00:00:00Z" });
    expect(ids).toEqual(["v1"]);
    const [v] = await yt.getVideos(ids);
    const chans = await yt.getChannels(["c1"]);
    const c = yt.toCollected(v, chans.get("c1"), { searchQuery: "IA para empresas", topic: "inteligência artificial" });
    expect(c.url).toBe("https://www.youtube.com/shorts/v1");
    expect(c.metrics.views).toBe(400000);
    expect(c.metrics.quality.shares).toBe("indisponivel");
    expect(c.channel.followers).toBe(50000);
    const b = await yt.channelBaseline(chans.get("c1")!, "v1");
    expect(b?.sampleSize).toBe(8);
    expect(b?.medianViews).toBeCloseTo(20003.5, 1);
    expect(calls.every((x) => x.includes("key=test-key"))).toBe(true);
  });

  it("propaga erro de cota como SourceError", async () => {
    vi.stubGlobal("fetch", async () => json({ error: { message: "quotaExceeded" } }, 403));
    const yt = await import("@/lib/sources/youtube");
    await expect(yt.searchShortIds("x", { regionCode: "US", publishedAfter: "2026-11-01T00:00:00Z" })).rejects.toThrow(/quota/);
  });
});

describe("adaptador Instagram (Business Discovery)", () => {
  it("usa engajamento como base e marca views/alcance/salvamentos como indisponíveis", async () => {
    const ig = await import("@/lib/sources/instagram");
    const media = Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, like_count: 1000 + i, comments_count: 10, media_product_type: "REELS", permalink: `https://instagram.com/p/${i}`, timestamp: "2026-11-06T10:00:00+0000", caption: "Legenda\nsegunda linha" }));
    const { videos, baseline } = ig.profileToCollected({ username: "fulano", followers_count: 90000, media: { data: media } }, "cr1");
    expect(videos).toHaveLength(6);
    expect(videos[0].metrics.views).toBeNull();
    expect(videos[0].metrics.quality.views).toBe("indisponivel");
    expect(videos[0].metrics.quality.saves).toBe("indisponivel");
    expect(videos[0].title).toBe("Legenda");
    expect(baseline?.medianEngagement).toBe(1012.5);
  });

  it("perfil inexistente/pessoal vira 'não encontrado'; erro de token é propagado", async () => {
    vi.stubGlobal("fetch", async () => json({ error: { message: "Invalid user id" } }, 400));
    let ig = await import("@/lib/sources/instagram");
    await expect(ig.lookupFollowers("naoexiste")).resolves.toMatchObject({ found: false });

    vi.resetModules();
    vi.stubGlobal("fetch", async () => json({ error: { message: "Error validating access token (OAuthException)" } }, 400));
    ig = await import("@/lib/sources/instagram");
    await expect(ig.lookupFollowers("qualquer")).rejects.toThrow(/token/);
  });

  it("valida seguidores reais retornados pela API", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      const decoded = decodeURIComponent(url.replace(/\+/g, " "));
      expect(decoded).toContain("business_discovery.username(dieguinhodiloreto)");
      expect(decoded).not.toContain("media.limit");
      return json({ business_discovery: { username: "dieguinhodiloreto", followers_count: 123456 } });
    });
    const ig = await import("@/lib/sources/instagram");
    await expect(ig.lookupFollowers("dieguinhodiloreto")).resolves.toMatchObject({ found: true, followers: 123456 });
  });
});

describe("rotação de consultas do radar", () => {
  it("respeita o limite de chamadas e alterna as consultas por dia", async () => {
    const { pickQueries } = await import("@/lib/pipeline/collect");
    const topics = [{ topic: "ia", queries: ["a", "b"] }, { topic: "mkt", queries: ["c"] }];
    const d0 = pickQueries(topics, 3, ["BR", "US"], 0);
    const d1 = pickQueries(topics, 3, ["BR", "US"], 1);
    expect(d0).toHaveLength(3);
    expect(d0[0].query).toBe("a");
    expect(d1[0].query).toBe("b");
  });
});
