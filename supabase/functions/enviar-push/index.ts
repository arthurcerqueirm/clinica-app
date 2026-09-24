// Lê a fila de `notificacoes` pendentes e dispara via Web Push — chamada pelo
// cron `enviar-notificacoes` a cada 5 min (PLANO.md §8.6). As notificações em
// si são geradas por funções SQL (ver supabase/migrations/*_notificacoes.sql);
// esta function só entrega o que já está na fila.
//
// Uso manual (spike validado na Fase 0 — ver README.md):
//   curl -X POST 'http://127.0.0.1:54321/functions/v1/enviar-push' \
//     -H 'Authorization: Bearer <ANON_KEY>'

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@example.com";

// Injetadas automaticamente pelo Supabase em toda Edge Function.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface ErroWebPush {
  statusCode?: number;
  message?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ erro: "VAPID não configurada" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: pendentes, error: erroBusca } = await supabase
    .from("notificacoes")
    .select("id, user_id, tipo, titulo, corpo, url_destino")
    .is("enviada_em", null)
    .lte("agendada_para", new Date().toISOString())
    .order("agendada_para")
    .limit(50);

  if (erroBusca) {
    return new Response(JSON.stringify({ erro: erroBusca.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let enviadas = 0;
  let falhas = 0;

  for (const notificacao of pendentes ?? []) {
    const { data: inscricoes } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", notificacao.user_id);

    let algumEnvioOk = false;

    for (const inscricao of inscricoes ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
          },
          JSON.stringify({
            titulo: notificacao.titulo,
            corpo: notificacao.corpo,
            url: notificacao.url_destino ?? "/",
            tag: notificacao.tipo,
          }),
        );
        algumEnvioOk = true;
        await supabase
          .from("push_subscriptions")
          .update({ ultimo_uso: new Date().toISOString() })
          .eq("id", inscricao.id);
      } catch (erro) {
        const erroTipado = erro as ErroWebPush;
        // 404/410: a inscrição não existe mais no serviço de push (navegador
        // desinstalou/limpou) — não adianta tentar de novo, então removemos.
        if (erroTipado.statusCode === 404 || erroTipado.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", inscricao.id);
        }
      }
    }

    if (algumEnvioOk) {
      await supabase
        .from("notificacoes")
        .update({ enviada_em: new Date().toISOString() })
        .eq("id", notificacao.id);
      enviadas++;
    } else {
      await supabase
        .from("notificacoes")
        .update({ erro: "Nenhuma inscrição ativa para essa usuária" })
        .eq("id", notificacao.id);
      falhas++;
    }
  }

  return new Response(
    JSON.stringify({ enviadas, falhas, total: pendentes?.length ?? 0 }),
    { headers: { "Content-Type": "application/json" } },
  );
});
