import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { lookupFollowers, instagramDiscoveryStatus } from "@/lib/sources/instagram";
import { getSetting } from "@/lib/pipeline/store";
import { errorMessage } from "@/lib/log";

export type ValidationOutcome =
  | { status: "validado" | "abaixo_minimo"; followers: number; source: string }
  | { status: "nao_encontrado"; reason: string }
  | { status: "pendente_validacao"; reason: string };

/** Regra de entrada: mínimo de seguidores no Instagram confirmado por fonte verificável. */
export function classifyFollowers(followers: number, min: number): "validado" | "abaixo_minimo" {
  return followers >= min ? "validado" : "abaixo_minimo";
}

export async function validateCreator(creatorId: string): Promise<ValidationOutcome> {
  const db = adminClient();
  const { data: c } = await db.from("creators").select("id,instagram_handle").eq("id", creatorId).single();
  if (!c?.instagram_handle) {
    const reason = "sem @ do Instagram cadastrado — informe o perfil para validar";
    await db.from("creators").update({ status: "pendente_validacao", validation_note: reason }).eq("id", creatorId);
    return { status: "pendente_validacao", reason };
  }
  const st = instagramDiscoveryStatus();
  if (!st.configured) {
    const reason = `validação automática indisponível (falta ${st.missing.join(", ")}). Use a validação manual com fonte.`;
    await db.from("creators").update({ validation_note: reason }).eq("id", creatorId);
    return { status: "pendente_validacao", reason };
  }
  const min = Number(await getSetting(db, "min_followers", 40000));
  try {
    const r = await lookupFollowers(c.instagram_handle);
    if (!r.found) {
      await db.from("creators").update({ status: "nao_encontrado", validation_note: r.reason, followers_checked_at: new Date().toISOString() }).eq("id", creatorId);
      return { status: "nao_encontrado", reason: r.reason };
    }
    const status = classifyFollowers(r.followers, min);
    await db.from("creator_follower_snapshots").insert({ creator_id: creatorId, platform: "instagram", followers: r.followers, source_id: "instagram_discovery" });
    await db
      .from("creators")
      .update({
        status,
        followers_count: r.followers,
        followers_source: "instagram_discovery",
        followers_checked_at: new Date().toISOString(),
        validation_note: status === "validado" ? `confirmado via Instagram Graph API (mínimo ${min})` : `abaixo do mínimo de ${min} seguidores`,
      })
      .eq("id", creatorId);
    return { status, followers: r.followers, source: "instagram_discovery" };
  } catch (e) {
    const reason = `erro na validação: ${errorMessage(e)}`;
    await db.from("creators").update({ validation_note: reason }).eq("id", creatorId);
    return { status: "pendente_validacao", reason };
  }
}

/** Validação manual: o usuário informa o número e a fonte (ex.: print/URL e data). Fica marcada como manual. */
export async function validateCreatorManually(creatorId: string, followers: number, evidence: string, userId: string) {
  const db = adminClient();
  const min = Number(await getSetting(db, "min_followers", 40000));
  const status = classifyFollowers(followers, min);
  await db.from("creator_follower_snapshots").insert({ creator_id: creatorId, platform: "instagram", followers, source_id: "manual" });
  await db
    .from("creators")
    .update({
      status,
      followers_count: followers,
      followers_source: "manual",
      followers_checked_at: new Date().toISOString(),
      validation_note: `informado manualmente (${evidence}) por ${userId}`,
    })
    .eq("id", creatorId);
  return status;
}
