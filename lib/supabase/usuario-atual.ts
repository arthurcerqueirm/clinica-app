import type { createClient } from "@/lib/supabase/server";

// getUser() lança se o refresh token do cookie for inválido/expirado (ex:
// sessão de antes de trocar o e-mail/PIN de acesso) — sem isso, um cookie
// velho derruba o processo inteiro do Next (unhandled rejection em produção).
// Mesmo cuidado em lib/supabase/middleware.ts, que roda antes de qualquer
// Server Action e normalmente já limpa o cookie ruim antes de chegar aqui.
export async function buscarUsuarioAtual(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}
