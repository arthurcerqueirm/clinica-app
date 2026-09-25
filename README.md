# Clínica — Gestão

PWA de uso interno para gerenciar agenda, clientes, pacotes e financeiro de uma
clínica de massoterapia. O plano completo (arquitetura, schema, roadmap) está em
[PLANO.md](./PLANO.md).

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (Postgres, Auth,
Edge Functions) + Serwist (PWA/push).

## Pré-requisitos

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — necessário para
  rodar o Supabase localmente
- Conta no [Supabase](https://supabase.com) (plano **Pro**, obrigatório — ver PLANO.md §2.3)
  para deploy

## Rodando localmente

```bash
npm install
npm run db:start   # sobe Postgres + Auth + Storage locais via Docker (primeira vez baixa ~2GB de imagens)
npm run dev         # http://localhost:3000
```

O `.env.local` já vem configurado para apontar para o Supabase **local** (as chaves
`ANON_KEY`/`SERVICE_ROLE_KEY` no arquivo são as chaves fixas e públicas do próprio
template do Supabase para desenvolvimento local — não são segredo).

## Login

Não há e-mail nem tela de cadastro (modelo de usuária única — só quem opera a
clínica acessa). A tela de login é um teclado de PIN de 6 dígitos
([app/(auth)/login/page.tsx](<app/(auth)/login/page.tsx>)); por baixo continua sendo
Supabase Auth normal — `lib/auth/constantes.ts` define um e-mail técnico fixo
(`EMAIL_LOGIN`, nunca mostrado na tela) e o PIN é a senha real desse usuário.

Para criar/ajustar essa usuária no Supabase local, use a API admin do GoTrue — troque
`<PIN>` pelo PIN desejado e mantenha o e-mail igual ao de `EMAIL_LOGIN`:

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/admin/users' \
  -H "apikey: $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)" \
  -H "Authorization: Bearer $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"email":"acesso@clinica.local","password":"<PIN>","email_confirm":true}'
```

Em produção, criar essa mesma usuária (mesmo e-mail, PIN escolhido) apontando pro
projeto real antes do primeiro acesso.

Studio local (interface do Supabase, tabelas/SQL) fica em http://127.0.0.1:54323
quando o `db:start` está rodando.

Para parar tudo: `npm run db:stop`.

> **Nota Windows/git-bash:** `supabase db reset` se mostrou instável nesse ambiente
> (erro de path). Se precisar recriar o banco do zero, prefira `npm run db:stop` seguido
> de `npm run db:start` — reaplica as migrations e o seed de forma limpa.

## Estrutura do banco

Todo o schema vive em `supabase/migrations/*.sql`, aplicado em ordem:

1. `20260922120000_schema.sql` — extensões, tipos, tabelas, índices, constraints
2. `20260922120100_views.sql` — views de apoio (saldo por cliente, fluxo de caixa, créditos de pacote)
3. `20260922120200_triggers.sql` — regras de negócio (geração de cobrança, consumo de crédito de pacote, status de cobrança, histórico de preço, auditoria)
4. `20260922120300_rls.sql` — Row Level Security em todas as tabelas

`supabase/seed.sql` cadastra categorias de despesa e horário de funcionamento padrão.

Depois de qualquer mudança no schema, regenerar os tipos TypeScript:

```bash
npm run db:types
```

## Conectando ao Supabase de produção

1. Criar um projeto no [supabase.com](https://supabase.com) — plano **Pro** (o free tier
   pausa o projeto após 7 dias de inatividade, o que quebra o cron de notificações — ver
   PLANO.md §2.3)
2. `npx supabase login`
3. `npx supabase link --project-ref <ref-do-projeto>`
4. `npx supabase db push` — aplica as migrations no projeto real
5. Rodar `supabase/seed.sql` manualmente uma vez (SQL Editor do Studio, ou `psql`)
6. Copiar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
   `SUPABASE_SERVICE_ROLE_KEY` (em Project Settings → API) para o `.env.local`
   (dev) e para as variáveis de ambiente da Vercel (produção)

## Mantendo o Supabase free tier "acordado"

O plano free do Supabase pausa o projeto inteiro após 7 dias sem atividade de
banco (ver PLANO.md §2.3). Pra não precisar do plano Pro só por causa disso,
`app/api/keep-alive/route.ts` faz uma query trivial (`select` em `configuracoes`)
e é chamada 1x/dia por um Cron Job da Vercel (`vercel.json`) — suficiente pra
contar como atividade e nunca pausar, mesmo se ninguém abrir o app.

Pra ativar em produção: gerar uma string aleatória (`openssl rand -hex 16`) e
colar como env var `CRON_SECRET` no projeto na Vercel — ela mesma injeta esse
valor como `Authorization: Bearer <CRON_SECRET>` nas chamadas do Cron Job, sem
precisar fazer mais nada. Sem essa env var, a rota não faz essa checagem (ok
em dev/local, onde não tem Cron chamando).

## Notificações push (Web Push)

As chaves VAPID já estão geradas e no `.env.local`/`.env.example`. Para gerar um novo
par (ex: em produção, chaves diferentes das de dev):

```bash
npx web-push generate-vapid-keys
```

### Como funciona

1. **Geração** — 8 funções SQL (`fn_gerar_*`, em `supabase/migrations/*_notificacoes.sql`)
   rodam via `pg_cron` nos horários certos e escrevem em `notificacoes`. Isso é
   autocontido (só SQL) e já está na migration, sem segredo nenhum.
2. **Envio** — a Edge Function `supabase/functions/enviar-push` lê `notificacoes`
   pendentes, busca as inscrições da usuária em `push_subscriptions` e dispara via
   `web-push`. Ela precisa das chaves VAPID em `supabase/functions/.env` (arquivo
   local, git-ignorado — copie de `.env.local`).

   > **Nota Windows:** se você editar `supabase/functions/.env` com o stack já rodando,
   > um `docker restart` no container do edge-runtime **não é suficiente** — as variáveis
   > só são lidas na hora que a CLI sobe o container. Rode `npm run db:stop` e
   > `npm run db:start` de novo.

3. **Disparo por cron** — falta ligar o ponto 1 no ponto 2 automaticamente. Isso
   *não* está numa migration comitada de propósito: exigiria colar a
   `service_role_key` em um arquivo versionado. Rode isso manualmente **uma vez**,
   direto no SQL Editor do Supabase Studio (local: http://127.0.0.1:54323, produção:
   painel do projeto), trocando `<SERVICE_ROLE_KEY>` pela chave real:

   ```sql
   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');

   select cron.schedule(
     'enviar-notificacoes',
     '*/5 * * * *',
     $$
     select net.http_post(
       url     := '<SUPABASE_URL>/functions/v1/enviar-push',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || (
           select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'
         )
       )
     );
     $$
   );
   ```

   Sem isso, as notificações continuam sendo geradas certinho em `notificacoes`, só
   não são enviadas sozinhas — dá pra disparar manualmente chamando a function (ver
   abaixo) ou pelo botão "Enviar notificação de teste" em Ajustes → Notificações,
   que já chama a function direto (sem depender desse cron).

### Testar manualmente

```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/enviar-push' \
  -H "Authorization: Bearer <ANON_KEY>"
```

Isso processa o que já estiver pendente em `notificacoes` (gere uma linha de teste
direto no banco, ou use o botão de teste na tela de Ajustes → Notificações do app).

## Deploy

- **Frontend:** Vercel (ou Cloudflare Pages) — build command padrão do Next.js.
  Lembrar de forçar webpack (ver `package.json` → `build`), já que o Serwist ainda
  não suporta Turbopack.
- **Backend:** Supabase (ver acima)
- Variáveis de ambiente completas em `.env.example`

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (webpack) |
| `npm run lint` | ESLint |
| `npm run db:start` / `db:stop` | Sobe/derruba o Supabase local |
| `npm run db:push` | Aplica migrations no projeto Supabase linkado |
| `npm run db:types` | Regenera `types/database.ts` a partir do schema |

## Roadmap

Ver [PLANO.md](./PLANO.md) §11. Estado atual: **Fases 0 a 4 concluídas** — projeto,
schema, auth, PWA, CRUD de clientes e serviços, agenda com criação de agendamento
(cálculo real de horários livres), registro de pagamentos, despesas (fixas e
ocasionais), dashboard financeiro com gráfico de evolução, tela de inadimplentes
com cobrança via WhatsApp (mensagem configurável), construtor de pacotes com
rateio de desconto, modelos reutilizáveis, expiração automática, fluxo de
inscrição em push com guia de instalação pro iOS, as 8 notificações automáticas
(geração via cron + envio via Edge Function, pipeline testado ponta a ponta
inclusive com limpeza automática de inscrições mortas), tela de preferências com
botão de teste, e cache offline de leitura da agenda — tudo validado com dados
reais.
