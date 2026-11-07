import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export type AppUser = { id: string; email: string; role: string };

export class AuthError extends Error {
  constructor(message: string, public status: 401 | 403) {
    super(message);
  }
}

/**
 * Retorna o usuário autenticado e membro da aplicação.
 * Na primeira entrada, e-mails listados em ALLOWED_EMAILS são registrados em app_users.
 */
export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;

  const admin = adminClient();
  const { data: existing } = await admin.from("app_users").select("id,email,role").eq("id", user.id).maybeSingle();
  if (existing) return existing as AppUser;

  const email = user.email.toLowerCase();
  if (!env.allowedEmails.includes(email)) return null;

  const { count } = await admin.from("app_users").select("id", { count: "exact", head: true });
  const role = (count ?? 0) === 0 ? "owner" : "editor";
  const { data: created, error } = await admin
    .from("app_users")
    .insert({ id: user.id, email, role })
    .select("id,email,role")
    .single();
  if (error) throw error;
  return created as AppUser;
}

/** Para páginas: redireciona quando não autorizado. */
export async function requirePageUser(): Promise<AppUser> {
  const u = await getAppUser();
  if (!u) redirect("/login?erro=acesso");
  return u;
}

/** Para rotas de API e server actions: lança AuthError. */
export async function requireUser(): Promise<AppUser> {
  const u = await getAppUser();
  if (!u) throw new AuthError("acesso negado", 403);
  return u;
}
