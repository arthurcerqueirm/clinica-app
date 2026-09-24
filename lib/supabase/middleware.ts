import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTA_LOGIN = "/login";
const ROTA_APOS_LOGIN = "/agenda";

// Login automático — só para testar no celular/rede local sem digitar senha.
// Dupla trava: nunca ativa se NODE_ENV === "production", mesmo que alguém
// esqueça as variáveis setadas em produção. Ver README.md → "Login automático (dev)".
const AUTO_LOGIN_ATIVO =
  process.env.NODE_ENV !== "production" &&
  Boolean(process.env.DEV_AUTO_LOGIN_EMAIL) &&
  Boolean(process.env.DEV_AUTO_LOGIN_PASSWORD);

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Não remover: revalida o token e mantém a sessão viva a cada navegação.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Refresh token inválido/expirado (ex: cookie de uma sessão de antes de
    // trocar o e-mail/PIN de acesso) — trata como deslogada em vez de deixar
    // a exceção subir: sem isso, esse cookie velho derrubava o processo
    // inteiro do Next a cada request (unhandled rejection em produção).
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) supabaseResponse.cookies.delete(cookie.name);
    }
  }

  if (!user && AUTO_LOGIN_ATIVO) {
    try {
      const { data } = await supabase.auth.signInWithPassword({
        email: process.env.DEV_AUTO_LOGIN_EMAIL!,
        password: process.env.DEV_AUTO_LOGIN_PASSWORD!,
      });
      user = data.user;
    } catch {
      // segue deslogada — cai no redirect pra /login normal, abaixo.
    }
  }

  const isRotaLogin = request.nextUrl.pathname.startsWith(ROTA_LOGIN);

  if (!user && !isRotaLogin) {
    const url = request.nextUrl.clone();
    url.pathname = ROTA_LOGIN;
    return NextResponse.redirect(url);
  }

  if (user && isRotaLogin) {
    const url = request.nextUrl.clone();
    url.pathname = ROTA_APOS_LOGIN;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
