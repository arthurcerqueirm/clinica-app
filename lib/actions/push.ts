"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buscarUsuarioAtual } from "@/lib/supabase/usuario-atual";

export async function salvarInscricaoPushAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  const supabase = await createClient();
  const user = await buscarUsuarioAtual(supabase);
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: subscription.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw new Error("Não foi possível salvar a inscrição.");
  revalidatePath("/ajustes/notificacoes");
}

export async function removerInscricaoPushAction(endpoint: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error("Não foi possível remover a inscrição.");
  revalidatePath("/ajustes/notificacoes");
}

export async function temInscricaoAtivaAction() {
  const supabase = await createClient();
  const user = await buscarUsuarioAtual(supabase);
  if (!user) return false;

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (count ?? 0) > 0;
}

export async function enviarNotificacaoTesteAction() {
  const supabase = await createClient();
  const user = await buscarUsuarioAtual(supabase);
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("notificacoes").insert({
    user_id: user.id,
    tipo: "teste",
    titulo: "Notificação de teste",
    corpo: "Se você está vendo isso, as notificações estão funcionando! 🎉",
    url_destino: "/agenda",
    agendada_para: new Date().toISOString(),
  });
  if (error) throw new Error("Não foi possível criar a notificação de teste.");

  // Dispara na hora, sem esperar o próximo ciclo do cron (a cada 5 min).
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enviar-push`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
    });
  } catch {
    // A notificação já está na fila — se o disparo imediato falhar, o cron
    // de 5 em 5 min ainda pega ela.
  }
}
