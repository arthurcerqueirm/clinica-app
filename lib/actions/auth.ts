"use server";

import { createClient } from "@/lib/supabase/server";
import { EMAIL_LOGIN } from "@/lib/auth/constantes";

// Roda no servidor (não no navegador) de propósito: em dev, acessado pelo
// celular via IP da rede local, o navegador não enxerga o Supabase em
// 127.0.0.1 (isso resolveria pro próprio celular). O servidor Next.js, sim.
export async function entrarComPinAction(pin: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: EMAIL_LOGIN,
    password: pin,
  });
  return { ok: !error };
}
