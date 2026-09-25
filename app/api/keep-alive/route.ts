import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

// Chamado 1x/dia pelo Cron Job da Vercel (vercel.json) só pra gerar atividade
// real de banco — sem isso, o Supabase free tier pausa o projeto inteiro após
// 7 dias sem uso (ver README.md → "Conectando ao Supabase de produção").
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.from("configuracoes").select("chave").limit(1);

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
