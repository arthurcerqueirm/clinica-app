# Plano Completo — App de Gestão para Clínica de Massagem

> PWA mobile-first, com notificações push 24/7, gestão de agenda, clientes, pacotes
> e financeiro.

**Versão do documento:** 1.0
**Data:** 22/09/2026
**Status:** Planejamento — nenhuma linha de código escrita ainda

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Decisões de arquitetura](#2-decisões-de-arquitetura)
3. [Stack tecnológica](#3-stack-tecnológica)
4. [Custos mensais](#4-custos-mensais)
5. [Modelo de dados](#5-modelo-de-dados)
6. [Módulos funcionais](#6-módulos-funcionais)
7. [Design system e UX mobile](#7-design-system-e-ux-mobile)
8. [PWA e notificações push](#8-pwa-e-notificações-push)
9. [IA — análise de conversas do WhatsApp](#9-ia--análise-de-conversas-do-whatsapp)
10. [Segurança, LGPD e backup](#10-segurança-lgpd-e-backup)
11. [Roadmap por fases](#11-roadmap-por-fases)
12. [Riscos e pontos de atenção](#12-riscos-e-pontos-de-atenção)
13. [Melhorias sugeridas (além do pedido)](#13-melhorias-sugeridas-além-do-pedido)
14. [Decisões pendentes](#14-decisões-pendentes)

---

## 1. Visão geral

### 1.1 O que é

Um aplicativo web progressivo (PWA) de uso **interno**, para a própria massoterapeuta
gerenciar o negócio pelo celular. Não é um app para as clientes usarem — as clientes
continuam se comunicando por WhatsApp normalmente.

### 1.2 Quem usa

- **Usuária primária:** a massoterapeuta (1 pessoa). Usa 100% no celular, várias vezes por dia,
  muitas vezes entre atendimentos, de pé, com uma mão só.
- **Usuárias futuras (opcional):** outras massoterapeutas contratadas, com permissões limitadas.

Essa premissa de "uma pessoa, no celular, com pressa" é o que justifica a obsessão com
fluidez e com reduzir número de toques por tarefa.

### 1.3 Objetivos principais

| # | Objetivo | Módulo |
|---|---|---|
| 1 | Ver e gerenciar a agenda de atendimentos | Agenda |
| 2 | Cadastrar, editar e arquivar clientes | Clientes |
| 3 | Gerenciar catálogo de massagens e preços | Serviços |
| 4 | Montar pacotes personalizados com desconto | Pacotes |
| 5 | Controlar entradas, saídas e contas a receber | Financeiro |
| 6 | Ver quem está devendo e cobrar via WhatsApp | Inadimplentes |
| 7 | Cadastrar despesas fixas e ocasionais | Despesas |
| 8 | Extrair dados de conversas do WhatsApp com IA | IA / Importação |
| 9 | Receber lembretes no celular, mesmo com app fechado | Notificações |

### 1.4 O que este app NÃO é (escopo negativo)

Definir isso agora evita crescimento descontrolado:

- ❌ Não é um app para a **cliente** agendar sozinha (sem portal do cliente no MVP)
- ❌ Não processa pagamentos (sem gateway, sem cartão) — só **registra** o que foi pago
- ❌ Não emite nota fiscal
- ❌ Não é um chat do WhatsApp dentro do app — só lê/analisa e abre o WhatsApp nativo
- ❌ Não envia mensagens automáticas para clientes no MVP (risco de banimento — ver §12.2)

---

## 2. Decisões de arquitetura

### 2.1 A pergunta original: "preciso contratar hospedagem?"

**Sim, mas menos do que parece.** Um PWA tem três partes, e só uma custa hospedagem de verdade:

| Parte | Onde roda | Custo |
|---|---|---|
| **Interface (PWA)** | No celular da usuária, depois de baixado | Só precisa servir arquivos estáticos — praticamente grátis |
| **Service Worker** | No celular, em background, gerenciado pelo sistema | Grátis |
| **Backend + banco + agendador** | Servidor na nuvem, 24/7 | **Aqui está o custo** |

O PWA em si **não fica rodando 24/7**. Quando você fecha o app, ele morre. Quem mantém a
notificação viva é o **Service Worker**, que o sistema operacional acorda quando chega um push.

Mas para *disparar* o push no momento certo (ex: "consulta em 1h"), alguém precisa estar
acordado às 3h da manhã checando o banco. Esse alguém é o backend — e é ele que precisa de
hospedagem 24/7.

### 2.2 Como uma notificação push realmente funciona

```
┌──────────────┐
│  1. PWA no   │  Usuária permite notificações.
│    celular   │  Service Worker se inscreve e recebe uma "subscription"
└──────┬───────┘  (endpoint URL + 2 chaves de criptografia).
       │
       │ salva a subscription
       ▼
┌──────────────┐
│  2. Banco    │  Tabela push_subscriptions.
│  (Supabase)  │
└──────┬───────┘
       │
       │ cron roda de 5 em 5 min
       ▼
┌──────────────┐
│ 3. Edge Fn   │  Checa: tem agendamento em <1h sem lembrete enviado?
│  (backend)   │  Tem despesa vencendo? Tem cliente devendo há 15 dias?
└──────┬───────┘  Se sim → assina a mensagem com a chave VAPID privada
       │
       │ POST criptografado
       ▼
┌──────────────┐
│ 4. Serviço   │  FCM (Android/Chrome), APNs (iOS/Safari),
│  de push da  │  Mozilla Push (Firefox). Você NÃO hospeda isso.
│  plataforma  │  É de graça e é quem realmente entrega no aparelho.
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. Service   │  Acorda mesmo com o app fechado, evento 'push'.
│   Worker     │  Mostra a notificação. Ao tocar, abre o app na tela certa.
└──────────────┘
```

**Ponto-chave:** a entrega é feita de graça pelo Google/Apple/Mozilla. Você só paga pelo
servidor que decide *quando* disparar.

### 2.3 Por que Supabase + Vercel

Você pediu algo **fácil de instalar, mesmo que mais caro**. As opções eram:

| Opção | Facilidade | Custo/mês | Cron nativo | Veredito |
|---|---|---|---|---|
| **Supabase + Vercel** | ⭐⭐⭐⭐⭐ | ~$45 | ✅ pg_cron | ✅ **Escolhida** |
| VPS (Hetzner/Oracle) + Docker | ⭐⭐ | ~$5-25 | ✅ crontab | Barato mas você vira sysadmin |
| Firebase | ⭐⭐⭐⭐ | variável | ✅ Cloud Scheduler | NoSQL complica os relatórios financeiros |
| Railway/Render + Postgres | ⭐⭐⭐ | ~$25 | ⚠️ add-on | Free tier "dorme", ruim para 24/7 |

**Supabase vence porque entrega em um único produto:** Postgres gerenciado, autenticação,
storage de arquivos, funções serverless (Edge Functions), **cron nativo (`pg_cron`)** e
realtime. Sem isso você juntaria 4 serviços diferentes na mão.

**Atenção ao free tier:** o plano gratuito do Supabase **pausa o projeto após 7 dias de
inatividade**. Para um app que precisa disparar cron às 3h da manhã, isso é inaceitável.
O plano **Pro ($25/mês) é obrigatório** — não é upsell, é requisito funcional.

### 2.4 Diagrama geral do sistema

```
                      CELULAR DA MASSOTERAPEUTA
          ┌──────────────────────────────────────────────┐
          │  PWA instalado na tela inicial               │
          │  ┌────────────────┐  ┌────────────────────┐  │
          │  │  Next.js App   │  │  Service Worker    │  │
          │  │  (React UI)    │  │  push + offline    │  │
          │  └───────┬────────┘  └─────────▲──────────┘  │
          └──────────┼─────────────────────┼─────────────┘
                     │ HTTPS               │ push
                     ▼                     │
   ┌─────────────────────────┐    ┌────────┴─────────────┐
   │  VERCEL                 │    │  FCM / APNs / Mozilla│
   │  ├ páginas estáticas    │    │  (grátis, da         │
   │  ├ Route Handlers       │    │   plataforma)        │
   │  └ /api/ia/analisar ────┼──┐ └────────▲─────────────┘
   └───────────┬─────────────┘  │          │
               │                │          │
               ▼                │          │
   ┌────────────────────────────┼──────────┼─────────────┐
   │  SUPABASE (Pro)            │          │             │
   │  ┌──────────────────────┐  │  ┌───────┴──────────┐  │
   │  │ Postgres + RLS       │  │  │ Edge Functions   │  │
   │  │ ├ clientes           │◄─┼──┤ ├ enviar-push    │  │
   │  │ ├ agendamentos       │  │  │ ├ processar-ia   │  │
   │  │ ├ cobrancas          │  │  │ └ webhook-wa     │  │
   │  │ ├ pagamentos         │  │  └───────▲──────────┘  │
   │  │ ├ despesas           │  │          │             │
   │  │ └ push_subscriptions │  │  ┌───────┴──────────┐  │
   │  └──────────────────────┘  │  │ pg_cron          │  │
   │  ┌──────────────────────┐  │  │ ├ */5 lembretes  │  │
   │  │ Storage (uploads de  │  │  │ ├ 07:00 agenda   │  │
   │  │ conversas .txt/.zip) │  │  │ └ 09:00 cobrança │  │
   │  └──────────────────────┘  │  └──────────────────┘  │
   └────────────────────────────┼────────────────────────┘
                                │
                                ▼
                   ┌────────────────────────┐
                   │  CLAUDE API            │
                   │  claude-opus-5         │
                   │  extração estruturada  │
                   └────────────────────────┘
```

---

## 3. Stack tecnológica

### 3.1 Frontend

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Server Components reduzem JS no celular; Route Handlers servem de backend leve; deploy trivial na Vercel |
| Linguagem | **TypeScript** (strict) | Dinheiro e datas são exatamente onde um `undefined` silencioso custa caro |
| Estilo | **Tailwind CSS v4** | Velocidade de iteração; design tokens em CSS nativo |
| Animação | **Motion** (`motion/react`) | Springs físicos = sensação de app nativo; anima só `transform`/`opacity` (60fps) |
| Bottom sheets | **Vaul** | Sheets com arrasto e inércia idênticos ao iOS; melhor que modal em mobile |
| Estado servidor | **TanStack Query** | Cache, revalidação e **updates otimistas** (UI responde antes da rede) |
| Formulários | **React Hook Form + Zod** | Validação compartilhada entre cliente e servidor |
| Datas | **date-fns** + `date-fns-tz` | Leve; `America/Sao_Paulo` tratado explicitamente |
| Gráficos | **Recharts** | Suficiente para o dashboard financeiro, responsivo |
| PWA | **Serwist** (sucessor do next-pwa) | Compatível com App Router; controle total do Service Worker |
| Ícones | **Lucide React** | Consistente, tree-shakeable |

### 3.2 Backend

| Camada | Escolha |
|---|---|
| Banco | Supabase Postgres 15 (com RLS) |
| Auth | Supabase Auth (e-mail + senha, ou magic link) |
| Serverless | Supabase Edge Functions (Deno) |
| Agendamento | `pg_cron` + `pg_net` chamando Edge Functions |
| Arquivos | Supabase Storage (uploads de conversas) |
| Push | `web-push` (VAPID) dentro de Edge Function |
| IA | Claude API — `claude-opus-5` |

### 3.3 Infraestrutura

| Serviço | Plano | Função |
|---|---|---|
| **Vercel** | Hobby (grátis) ou Pro ($20) | Hospeda o PWA e as Route Handlers |
| **Supabase** | **Pro ($25)** — obrigatório | Banco 24/7, cron, funções, storage |
| **Anthropic** | Pay-as-you-go | Análise de conversas |
| **Registro.br** | ~R$40/ano | Domínio `.com.br` |

> **Sobre a Vercel:** o plano Hobby é gratuito mas as regras de uso comercial são ambíguas.
> Para um negócio real, o Pro ($20/mês) evita dor de cabeça. Se quiser economizar, o
> **Cloudflare Pages** é gratuito e permite uso comercial explicitamente.

---

## 4. Custos mensais

### 4.1 Cenário realista (1 profissional, ~150 clientes, ~200 atendimentos/mês)

| Item | Custo (USD) | Custo (BRL ~5,40) |
|---|---|---|
| Supabase Pro | $25,00 | R$ 135 |
| Vercel Pro | $20,00 | R$ 108 |
| Claude API (uso contínuo, ~40 análises/mês) | ~$3,00 | R$ 16 |
| Domínio (amortizado) | ~$0,60 | R$ 3 |
| **Total mensal** | **~$48,60** | **~R$ 262** |

### 4.2 Cenário econômico

| Item | Custo |
|---|---|
| Supabase Pro | $25,00 |
| Cloudflare Pages (grátis, permite comercial) | $0 |
| Claude API | ~$3,00 |
| **Total** | **~$28/mês (~R$ 151)** |

### 4.3 Custo pontual: importação inicial do histórico

Analisar de uma vez todas as conversas antigas (ex: 150 clientes × ~15k tokens cada):

| Método | Custo estimado |
|---|---|
| Requisições normais | ~$18 |
| **Message Batches API (50% off)** | **~$9** |

Recomendação: usar a **Batch API** para o backfill inicial. Não é urgente, pode levar horas.

---

## 5. Modelo de dados

### 5.1 Princípios adotados

Três decisões que parecem detalhe mas evitam retrabalho grande depois:

1. **Dinheiro em centavos (`BIGINT`), nunca `FLOAT`.**
   `0.1 + 0.2 !== 0.3` em ponto flutuante. Em um sistema financeiro isso vira divergência
   de centavos que ninguém consegue explicar. Tudo é inteiro; a formatação para "R$ 180,00"
   acontece só na tela.

2. **Soft delete em clientes (arquivar, não apagar).**
   Você pediu "poder excluir clientes". Mas se apagar de verdade uma cliente que tem 2 anos
   de atendimentos, o faturamento histórico quebra. A solução: o botão continua sendo
   "Excluir" na interface, mas por baixo grava `arquivado_em`. Some de todas as listas,
   histórico financeiro intacto. Se ela voltar, um toque restaura tudo.
   *Exclusão permanente fica disponível em Ajustes, com confirmação dupla, e só para clientes
   sem nenhum atendimento.*

3. **Snapshot de preço em toda transação.**
   Quando você aumentar a massagem relaxante de R$150 para R$180, os 400 atendimentos do
   passado **não podem** virar R$180 retroativamente. Por isso todo agendamento guarda o
   preço cobrado no momento, não uma referência viva ao catálogo.

### 5.2 Diagrama de relacionamentos

```
                        ┌─────────────┐
                        │  clientes   │
                        └──────┬──────┘
                               │
        ┌──────────────┬───────┴────────┬──────────────────┐
        │              │                │                  │
        ▼              ▼                ▼                  ▼
┌──────────────┐ ┌──────────┐  ┌────────────────┐  ┌──────────────┐
│ agendamentos │ │ pacotes  │  │ conversas_wa   │  │  cobrancas   │
└──────┬───────┘ └────┬─────┘  └───────┬────────┘  └──────┬───────┘
       │              │                │                   │
       │         ┌────▼──────────┐     ▼                   ▼
       │         │ pacote_itens  │ ┌─────────────┐  ┌──────────────┐
       │         └────┬──────────┘ │ analises_ia │  │  pagamentos  │
       │              │            └──────┬──────┘  └──────────────┘
       ▼              ▼                   ▼
┌──────────────┐                  ┌──────────────┐
│   servicos   │                  │ sugestoes_ia │
└──────────────┘                  └──────────────┘

    ┌──────────┐   ┌────────────────────┐   ┌──────────────────┐
    │ despesas │   │ push_subscriptions │   │  notificacoes    │
    └────┬─────┘   └────────────────────┘   └──────────────────┘
         ▼
 ┌───────────────────┐
 │ categorias_despesa│
 └───────────────────┘
```

### 5.3 Schema SQL completo

```sql
-- ═══════════════════════════════════════════════════════════
-- EXTENSÕES
-- ═══════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_cron";    -- agendamento
create extension if not exists "pg_net";     -- chamadas HTTP do banco
create extension if not exists "unaccent";   -- busca sem acento
create extension if not exists "pg_trgm";    -- busca fuzzy por nome


-- ═══════════════════════════════════════════════════════════
-- TIPOS
-- ═══════════════════════════════════════════════════════════
create type status_agendamento as enum (
  'agendado', 'confirmado', 'concluido', 'cancelado', 'faltou'
);

create type status_cobranca as enum (
  'aberta', 'parcial', 'paga', 'cancelada'
);

create type metodo_pagamento as enum (
  'pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'transferencia', 'outro'
);

create type tipo_despesa as enum ('fixa', 'ocasional');

create type recorrencia as enum ('nenhuma', 'semanal', 'mensal', 'bimestral', 'trimestral', 'anual');

create type status_pacote as enum ('ativo', 'concluido', 'expirado', 'cancelado');

create type tipo_desconto as enum ('percentual', 'valor');

create type origem_cobranca as enum ('agendamento', 'pacote', 'avulso');

create type status_sugestao as enum ('pendente', 'aprovada', 'rejeitada', 'aplicada');


-- ═══════════════════════════════════════════════════════════
-- CLIENTES
-- ═══════════════════════════════════════════════════════════
create table clientes (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  telefone          text,                    -- E.164: +5511987654321
  email             text,
  data_nascimento   date,

  -- Ficha de saúde (anamnese) — crítico em massoterapia
  restricoes_saude  text,                    -- hérnia, gestação, hipertensão...
  alergias          text,                    -- óleos essenciais, látex
  preferencias      text,                    -- "pressão forte", "não gosta de música"

  observacoes       text,
  tags              text[] default '{}',     -- 'vip', 'indicação', 'corporativo'

  -- Origem
  como_conheceu     text,

  arquivado_em      timestamptz,             -- soft delete
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),

  constraint telefone_e164 check (
    telefone is null or telefone ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create index idx_clientes_ativos    on clientes (nome) where arquivado_em is null;
create index idx_clientes_telefone  on clientes (telefone) where arquivado_em is null;
create index idx_clientes_busca     on clientes using gin (nome gin_trgm_ops);


-- ═══════════════════════════════════════════════════════════
-- SERVIÇOS (catálogo de massagens)
-- ═══════════════════════════════════════════════════════════
create table servicos (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,             -- "Massagem Relaxante"
  descricao       text,
  duracao_min     int  not null,             -- usado para calcular fim na agenda
  preco_centavos  bigint not null,           -- 18000 = R$ 180,00
  cor             text not null default '#8B7CF6',  -- cor na agenda
  ordem           int  not null default 0,   -- ordem de exibição
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),

  constraint duracao_valida check (duracao_min > 0 and duracao_min <= 480),
  constraint preco_valido   check (preco_centavos >= 0)
);

-- Histórico de preços: auditoria de quando/quanto mudou
create table servicos_historico_preco (
  id                  uuid primary key default gen_random_uuid(),
  servico_id          uuid not null references servicos(id) on delete cascade,
  preco_anterior      bigint not null,
  preco_novo          bigint not null,
  alterado_em         timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════
-- PACOTES (montados sob medida para cada cliente)
-- ═══════════════════════════════════════════════════════════
create table pacotes (
  id                   uuid primary key default gen_random_uuid(),
  cliente_id           uuid not null references clientes(id) on delete restrict,
  nome                 text not null,        -- "Pacote 10 sessões - Maria"

  valor_bruto_centavos bigint not null,      -- soma dos itens sem desconto
  desconto_tipo        tipo_desconto not null default 'percentual',
  desconto_valor       numeric(10,2) not null default 0,  -- 15.00 = 15% ou R$15,00
  valor_final_centavos bigint not null,      -- o que a cliente efetivamente paga

  validade             date,                 -- null = sem expiração
  status               status_pacote not null default 'ativo',
  observacoes          text,

  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now(),

  constraint valores_coerentes check (
    valor_final_centavos >= 0 and valor_final_centavos <= valor_bruto_centavos
  )
);

create index idx_pacotes_cliente on pacotes (cliente_id, status);

create table pacote_itens (
  id                        uuid primary key default gen_random_uuid(),
  pacote_id                 uuid not null references pacotes(id) on delete cascade,
  servico_id                uuid not null references servicos(id) on delete restrict,

  quantidade                int not null,
  quantidade_usada          int not null default 0,

  -- Snapshots: preço no momento da venda + preço já com desconto rateado.
  -- O segundo é o que vale para contabilizar consumo.
  preco_unitario_centavos           bigint not null,
  preco_unitario_com_desconto_centavos bigint not null,

  constraint quantidade_valida check (quantidade > 0),
  constraint consumo_valido    check (quantidade_usada between 0 and quantidade)
);

create index idx_pacote_itens_pacote on pacote_itens (pacote_id);

-- Modelos de pacote reutilizáveis (conveniência — não obrigatório)
create table pacote_modelos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  desconto_tipo  tipo_desconto not null,
  desconto_valor numeric(10,2) not null,
  itens          jsonb not null,   -- [{servico_id, quantidade}]
  criado_em      timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════
-- AGENDA
-- ═══════════════════════════════════════════════════════════
create table agendamentos (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid not null references clientes(id) on delete restrict,
  servico_id         uuid not null references servicos(id) on delete restrict,

  -- Se vier de pacote, consome um crédito e NÃO gera cobrança nova
  pacote_item_id     uuid references pacote_itens(id) on delete set null,

  inicio             timestamptz not null,
  fim                timestamptz not null,

  status             status_agendamento not null default 'agendado',

  -- Snapshots no momento do agendamento
  preco_centavos     bigint not null,        -- preço de tabela na data
  desconto_centavos  bigint not null default 0,
  valor_cobrado_centavos bigint generated always as
                     (preco_centavos - desconto_centavos) stored,

  observacoes        text,
  notas_sessao       text,                   -- preenchido após o atendimento

  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now(),

  constraint periodo_valido check (fim > inicio),
  constraint desconto_valido check (desconto_centavos between 0 and preco_centavos)
);

create index idx_agendamentos_periodo on agendamentos (inicio, fim);
create index idx_agendamentos_cliente on agendamentos (cliente_id, inicio desc);
create index idx_agendamentos_status  on agendamentos (status, inicio);

-- Impede dois atendimentos sobrepostos (exceto cancelados/faltas)
create extension if not exists btree_gist;
alter table agendamentos add constraint sem_sobreposicao
  exclude using gist (
    tstzrange(inicio, fim) with &&
  ) where (status in ('agendado', 'confirmado', 'concluido'));

-- Bloqueios de agenda: férias, almoço, compromisso pessoal
create table bloqueios (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  inicio     timestamptz not null,
  fim        timestamptz not null,
  criado_em  timestamptz not null default now(),
  constraint periodo_valido check (fim > inicio)
);

-- Horário de funcionamento padrão (para sugerir horários livres)
create table horarios_atendimento (
  id          uuid primary key default gen_random_uuid(),
  dia_semana  int not null,        -- 0=domingo ... 6=sábado
  hora_inicio time not null,
  hora_fim    time not null,
  ativo       boolean not null default true,
  constraint dia_valido    check (dia_semana between 0 and 6),
  constraint horas_validas check (hora_fim > hora_inicio)
);


-- ═══════════════════════════════════════════════════════════
-- FINANCEIRO — CONTAS A RECEBER
-- ═══════════════════════════════════════════════════════════
create table cobrancas (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references clientes(id) on delete restrict,

  origem_tipo     origem_cobranca not null,
  agendamento_id  uuid references agendamentos(id) on delete set null,
  pacote_id       uuid references pacotes(id) on delete set null,

  descricao       text not null,
  valor_centavos  bigint not null,
  vencimento      date,
  status          status_cobranca not null default 'aberta',

  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),

  constraint valor_positivo check (valor_centavos > 0)
);

create index idx_cobrancas_cliente on cobrancas (cliente_id, status);
create index idx_cobrancas_abertas on cobrancas (vencimento)
  where status in ('aberta', 'parcial');

create table pagamentos (
  id              uuid primary key default gen_random_uuid(),
  cobranca_id     uuid not null references cobrancas(id) on delete cascade,
  valor_centavos  bigint not null,
  metodo          metodo_pagamento not null,
  pago_em         timestamptz not null default now(),
  observacao      text,
  criado_em       timestamptz not null default now(),

  constraint valor_positivo check (valor_centavos > 0)
);

create index idx_pagamentos_cobranca on pagamentos (cobranca_id);
create index idx_pagamentos_data     on pagamentos (pago_em desc);


-- ═══════════════════════════════════════════════════════════
-- FINANCEIRO — DESPESAS
-- ═══════════════════════════════════════════════════════════
create table categorias_despesa (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null unique,   -- Aluguel, Produtos, Marketing, Impostos...
  cor    text not null default '#94A3B8',
  icone  text
);

create table despesas (
  id              uuid primary key default gen_random_uuid(),
  categoria_id    uuid references categorias_despesa(id) on delete set null,

  descricao       text not null,
  valor_centavos  bigint not null,
  tipo            tipo_despesa not null,
  recorrencia     recorrencia not null default 'nenhuma',

  -- Para fixas: dia do mês em que vence (1-31)
  dia_vencimento  int,
  -- Para ocasionais: a data em que ocorreu
  data_despesa    date,

  ativa           boolean not null default true,   -- fixa pode ser desativada
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),

  constraint valor_positivo   check (valor_centavos > 0),
  constraint dia_valido       check (dia_vencimento is null or dia_vencimento between 1 and 31),
  constraint coerencia_tipo   check (
    (tipo = 'fixa'      and dia_vencimento is not null) or
    (tipo = 'ocasional' and data_despesa   is not null)
  )
);

-- Cada ocorrência mensal de uma despesa fixa vira uma linha aqui,
-- gerada automaticamente pelo cron no dia 1º de cada mês.
create table despesas_ocorrencias (
  id              uuid primary key default gen_random_uuid(),
  despesa_id      uuid not null references despesas(id) on delete cascade,
  competencia     date not null,             -- 2026-09-01 = setembro/2026
  valor_centavos  bigint not null,
  vencimento      date not null,
  pago            boolean not null default false,
  pago_em         timestamptz,
  metodo          metodo_pagamento,

  unique (despesa_id, competencia)
);

create index idx_ocorrencias_pendentes on despesas_ocorrencias (vencimento)
  where pago = false;


-- ═══════════════════════════════════════════════════════════
-- WHATSAPP + IA
-- ═══════════════════════════════════════════════════════════
create table conversas_whatsapp (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete set null,  -- null = não vinculada

  origem          text not null,             -- 'upload_txt' | 'api'
  nome_contato    text,                      -- nome como aparece no WhatsApp
  telefone        text,

  arquivo_path    text,                      -- caminho no Supabase Storage
  conteudo_bruto  text,                      -- texto normalizado
  total_mensagens int,
  periodo_inicio  timestamptz,
  periodo_fim     timestamptz,

  criado_em       timestamptz not null default now()
);

create table analises_ia (
  id                uuid primary key default gen_random_uuid(),
  conversa_id       uuid not null references conversas_whatsapp(id) on delete cascade,

  modelo            text not null,           -- 'claude-opus-5'
  versao_prompt     text not null,           -- 'v1.2' — permite reanálise comparativa
  resultado         jsonb,                   -- saída estruturada crua

  tokens_entrada    int,
  tokens_saida      int,
  tokens_cache_read int,
  custo_centavos_usd int,

  status            text not null default 'pendente',  -- pendente|processando|concluida|erro
  erro              text,

  iniciada_em       timestamptz not null default now(),
  concluida_em      timestamptz
);

-- Cada fato extraído vira uma sugestão que PRECISA de aprovação humana
create table sugestoes_ia (
  id            uuid primary key default gen_random_uuid(),
  analise_id    uuid not null references analises_ia(id) on delete cascade,
  cliente_id    uuid references clientes(id) on delete cascade,

  tipo          text not null,               -- agendamento|pagamento|divida|pacote|observacao
  payload       jsonb not null,              -- dados prontos para virar registro real
  confianca     numeric(3,2) not null,       -- 0.00 a 1.00
  evidencia     text not null,               -- trecho literal da conversa que embasa

  status        status_sugestao not null default 'pendente',
  aplicada_em   timestamptz,
  registro_id   uuid,                        -- id do registro criado ao aprovar

  criado_em     timestamptz not null default now(),

  constraint confianca_valida check (confianca between 0 and 1)
);

create index idx_sugestoes_pendentes on sugestoes_ia (status, confianca desc)
  where status = 'pendente';


-- ═══════════════════════════════════════════════════════════
-- NOTIFICAÇÕES
-- ═══════════════════════════════════════════════════════════
create table push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  criado_em    timestamptz not null default now(),
  ultimo_uso   timestamptz
);

create table notificacoes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  tipo            text not null,   -- lembrete_agendamento|resumo_diario|cobranca|despesa|...
  titulo          text not null,
  corpo           text not null,
  url_destino     text,            -- deep link: /agenda/2026-09-22

  -- Idempotência: impede enviar o mesmo lembrete duas vezes
  chave_unica     text unique,     -- ex: 'lembrete:<agendamento_id>:1h'

  agendada_para   timestamptz not null,
  enviada_em      timestamptz,
  lida_em         timestamptz,
  erro            text
);

create index idx_notificacoes_pendentes on notificacoes (agendada_para)
  where enviada_em is null;


-- ═══════════════════════════════════════════════════════════
-- CONFIGURAÇÕES E AUDITORIA
-- ═══════════════════════════════════════════════════════════
create table configuracoes (
  chave  text primary key,
  valor  jsonb not null
);

create table auditoria (
  id          bigserial primary key,
  tabela      text not null,
  registro_id uuid,
  operacao    text not null,      -- INSERT | UPDATE | DELETE
  dados_antes jsonb,
  dados_depois jsonb,
  user_id     uuid,
  criado_em   timestamptz not null default now()
);

create index idx_auditoria_registro on auditoria (tabela, registro_id, criado_em desc);
```

### 5.4 Views de apoio

```sql
-- Saldo devedor por cliente (a base da tela de inadimplentes)
create view vw_saldo_cliente as
select
  c.id            as cliente_id,
  c.nome,
  c.telefone,
  coalesce(sum(cob.valor_centavos), 0)                as total_cobrado,
  coalesce(sum(pg.pago), 0)                           as total_pago,
  coalesce(sum(cob.valor_centavos), 0)
    - coalesce(sum(pg.pago), 0)                       as saldo_devedor,
  min(cob.vencimento) filter (
    where cob.status in ('aberta','parcial')
  )                                                   as vencimento_mais_antigo,
  count(*) filter (where cob.status in ('aberta','parcial')) as cobrancas_abertas
from clientes c
left join cobrancas cob
  on cob.cliente_id = c.id and cob.status <> 'cancelada'
left join lateral (
  select coalesce(sum(p.valor_centavos), 0) as pago
  from pagamentos p where p.cobranca_id = cob.id
) pg on true
where c.arquivado_em is null
group by c.id, c.nome, c.telefone;


-- Fluxo de caixa mensal (receitas realizadas x despesas pagas)
create view vw_fluxo_caixa_mensal as
with receitas as (
  select date_trunc('month', pago_em)::date as mes,
         sum(valor_centavos)                as valor
  from pagamentos group by 1
),
saidas as (
  select date_trunc('month', pago_em)::date as mes,
         sum(valor_centavos)                as valor
  from despesas_ocorrencias where pago group by 1
)
select
  coalesce(r.mes, s.mes)            as mes,
  coalesce(r.valor, 0)              as entradas,
  coalesce(s.valor, 0)              as saidas,
  coalesce(r.valor,0) - coalesce(s.valor,0) as resultado
from receitas r
full outer join saidas s on r.mes = s.mes
order by mes desc;


-- Créditos de pacote ainda disponíveis
create view vw_creditos_pacote as
select
  p.id            as pacote_id,
  p.cliente_id,
  c.nome          as cliente_nome,
  s.nome          as servico_nome,
  pi.id           as pacote_item_id,
  pi.quantidade,
  pi.quantidade_usada,
  pi.quantidade - pi.quantidade_usada as disponivel,
  p.validade
from pacotes p
join pacote_itens pi on pi.pacote_id = p.id
join servicos s      on s.id = pi.servico_id
join clientes c      on c.id = p.cliente_id
where p.status = 'ativo'
  and pi.quantidade_usada < pi.quantidade
  and (p.validade is null or p.validade >= current_date);
```

### 5.5 Regras de negócio no banco (triggers)

Implementar como triggers garante que a regra vale mesmo se um bug na interface tentar
violá-la:

| Trigger | Regra |
|---|---|
| `trg_atualizar_status_cobranca` | Ao inserir/remover pagamento, recalcula `status` da cobrança (`aberta`/`parcial`/`paga`) |
| `trg_gerar_cobranca_agendamento` | Ao mudar agendamento para `concluido` **sem** `pacote_item_id`, cria a cobrança automaticamente |
| `trg_consumir_credito_pacote` | Ao concluir agendamento **com** `pacote_item_id`, incrementa `quantidade_usada`; bloqueia se não houver crédito |
| `trg_finalizar_pacote` | Quando todos os itens são consumidos, marca pacote como `concluido` |
| `trg_registrar_historico_preco` | Ao alterar `preco_centavos` de serviço, grava em `servicos_historico_preco` |
| `trg_atualizado_em` | Mantém `atualizado_em` em todas as tabelas |
| `trg_auditoria` | Registra INSERT/UPDATE/DELETE nas tabelas sensíveis |

---

## 6. Módulos funcionais

### 6.1 Agenda (tela inicial)

**Por que é a home:** é a tela que a usuária abre 20 vezes por dia. Abrir o app já mostrando
"o que tenho agora" elimina um toque de navegação em toda sessão de uso.

**Visualizações:**
- **Dia** (padrão) — timeline vertical, blocos coloridos por serviço, hora atual marcada
- **Semana** — grade compacta, 7 colunas, toque abre o dia
- **Mês** — calendário com pontos indicando densidade; toque abre o dia
- **Lista** — próximos atendimentos em sequência, útil para "o que vem depois"

**Card de atendimento mostra:**
- Nome da cliente + foto/inicial
- Serviço e duração
- Badge de status (agendado / confirmado / concluído / faltou)
- 💰 Indicador de pendência financeira, se houver
- 📦 Selo de pacote, se consumir crédito

**Ações rápidas (swipe no card):**
- ← Arrastar esquerda: Concluir atendimento
- → Arrastar direita: Abrir WhatsApp da cliente
- Toque longo: menu (Reagendar / Cancelar / Marcar falta / Editar)

**Fluxo de novo agendamento** (meta: ≤ 5 toques):
```
FAB (+) → Sheet abre
  ├ 1. Buscar cliente (campo já focado, teclado aberto)
  │     └ Se não existe → "Cadastrar «Maria»" inline, sem sair do fluxo
  ├ 2. Escolher serviço (chips horizontais com preço visível)
  │     └ Se a cliente tem crédito de pacote → chip destacado "📦 Usar pacote (3 restantes)"
  ├ 3. Data (chips: Hoje / Amanhã / calendário)
  ├ 4. Horário (grade de slots livres, já calculada pelo horário de funcionamento)
  └ 5. Confirmar → salva com update otimista, sheet fecha
```

**Detalhes técnicos importantes:**
- Fuso `America/Sao_Paulo` tratado explicitamente; armazenar sempre `timestamptz` em UTC
- Constraint `sem_sobreposicao` impede double-booking no nível do banco
- Slots livres calculados a partir de `horarios_atendimento` − `agendamentos` − `bloqueios`

---

### 6.2 Clientes

**Lista:**
- Busca instantânea, sem acento e por telefone (`unaccent` + `pg_trgm`)
- Índice alfabético lateral (A-Z) para rolagem rápida, estilo contatos do iOS
- Filtros em chips: Todos / Devendo / Com pacote ativo / Inativos há 60d / Aniversariantes
- Cada linha: avatar com inicial, nome, último atendimento, badge de dívida

**Ficha da cliente (abas):**

| Aba | Conteúdo |
|---|---|
| **Resumo** | Contato, próximo agendamento, saldo devedor, total gasto histórico, frequência média |
| **Histórico** | Linha do tempo de atendimentos com notas de sessão |
| **Financeiro** | Cobranças, pagamentos, saldo; botão "Registrar pagamento" |
| **Pacotes** | Pacotes ativos com barra de progresso (ex: ▓▓▓▓▓░░░ 5/8 usadas) |
| **Saúde** | Restrições, alergias, preferências — **destaque visual forte**, é informação de segurança |

**Ações no topo:** 📞 Ligar · 💬 WhatsApp · 📅 Agendar · ✏️ Editar

**Sobre "excluir":** conforme §5.1, o botão grava `arquivado_em`. A interface diz
*"Cliente arquivada. Histórico financeiro preservado."* com opção **Desfazer** por 5 segundos.

---

### 6.3 Serviços e preços

Tela simples de CRUD, mas com detalhes que importam:

- Lista reordenável por arrasto (define a ordem nos chips de agendamento)
- Cada serviço: nome, duração, preço, cor, descrição, ativo/inativo
- **Desativar em vez de excluir** — serviço usado em histórico não pode sumir
- Ao alterar preço, aviso explícito:
  > *"Isso afeta apenas novos agendamentos. Os 47 atendimentos anteriores mantêm o preço
  > cobrado na época."*
- Aba "Histórico de preços" mostrando a evolução

---

### 6.4 Pacotes

Esta é a parte com mais regra de negócio. Você especificou: **pacotes não são pré-prontos** —
cada um é montado na hora, combinando massagens com um desconto.

**Fluxo de montagem:**
```
┌─────────────────────────────────────────┐
│  Novo Pacote                            │
├─────────────────────────────────────────┤
│  Cliente:  [ Maria Silva          ▾ ]   │
│  Nome:     [ Pacote Maria - Set/26  ]   │
├─────────────────────────────────────────┤
│  ITENS                                  │
│                                         │
│  Relaxante 60min                        │
│  R$ 180,00        [ − ]  6  [ + ]       │
│                          R$ 1.080,00    │
│                                         │
│  Drenagem 50min                         │
│  R$ 200,00        [ − ]  2  [ + ]       │
│                            R$ 400,00    │
│                                         │
│  [ + Adicionar serviço ]                │
├─────────────────────────────────────────┤
│  Subtotal                   R$ 1.480,00 │
│                                         │
│  Desconto:  ( ● % )  ( ○ R$ )           │
│             [    15   ]                 │
│                           − R$ 222,00   │
├─────────────────────────────────────────┤
│  TOTAL                      R$ 1.258,00 │
│  Economia de R$ 222,00 (15%)            │
├─────────────────────────────────────────┤
│  Validade: [ 31/12/2026 ]  ( sem prazo )│
│                                         │
│  [ Salvar como modelo ]   [ Criar ]     │
└─────────────────────────────────────────┘
```

**Regras:**

1. **Rateio do desconto.** O desconto é proporcional ao valor de cada item, não dividido
   igualmente. Se o pacote tem R$1.080 de relaxante e R$400 de drenagem com 15% off, cada
   um perde 15% do próprio valor. Isso é armazenado em
   `preco_unitario_com_desconto_centavos` para que o consumo seja contabilizado corretamente.

2. **Uma cobrança só.** Criar o pacote gera **uma** cobrança de R$1.258,00. Pode ser paga à
   vista ou parcelada (vários `pagamentos` contra a mesma `cobranca`).

3. **Consumo não gera cobrança.** Agendamentos marcados com `pacote_item_id` incrementam
   `quantidade_usada` e **não** criam cobrança nova — senão a cliente pagaria duas vezes.

4. **Bloqueio de saldo.** Trigger impede consumir crédito inexistente.

5. **Expiração.** Cron diário marca pacotes vencidos como `expirado`; push avisa 7 dias antes.

6. **Modelos (melhoria sugerida).** Mesmo sendo sob medida, na prática 80% dos pacotes se
   repetem. "Salvar como modelo" permite recriar o mesmo conjunto em 1 toque e depois ajustar.

---

### 6.5 Financeiro

**Dashboard** — período selecionável (Hoje / Semana / Mês / Ano / Personalizado):

```
╭──────────────────────────────────────╮
│  Setembro 2026            [ Mês ▾ ]  │
╰──────────────────────────────────────╯

╭─────────────────╮  ╭─────────────────╮
│  ENTRADAS       │  │  SAÍDAS         │
│  R$ 12.450,00   │  │  R$ 3.280,00    │
│  ↑ 12% vs ago   │  │  ↓ 5% vs ago    │
╰─────────────────╯  ╰─────────────────╯

╭─────────────────╮  ╭─────────────────╮
│  RESULTADO      │  │  A RECEBER      │
│  R$ 9.170,00    │  │  R$ 1.840,00    │
│  margem 73,6%   │  │  6 clientes  →  │
╰─────────────────╯  ╰─────────────────╯

  ▁▃▅▇█▅▃  Evolução 6 meses
```

**Seções:**

- **Entradas** — lista de pagamentos recebidos, agrupada por dia, filtro por método
- **Saídas** — despesas pagas, agrupadas por categoria, com gráfico de pizza
- **A receber** — cobranças em aberto, ordenadas por vencimento (leva à tela de inadimplentes)
- **Projeção** — receita esperada de agendamentos futuros já marcados

**Indicadores adicionais (sugestão):**
- Ticket médio por atendimento
- Serviço mais rentável (receita total, não preço unitário)
- Taxa de ocupação da agenda (horas agendadas ÷ horas disponíveis)
- Taxa de falta (`faltou` ÷ total)
- Clientes novos no mês vs recorrentes

---

### 6.6 Inadimplentes e cobrança via WhatsApp

Tela dedicada, alimentada por `vw_saldo_cliente`.

```
╭──────────────────────────────────────╮
│  A receber          R$ 1.840,00      │
│  6 clientes                          │
╰──────────────────────────────────────╯

[ Todos ] [ +30 dias ] [ +60 dias ]

╭──────────────────────────────────────╮
│ 🔴  Ana Paula                        │
│     R$ 540,00 · vencido há 47 dias   │
│     3 atendimentos em aberto         │
│                                      │
│  [ 💬 Cobrar ]  [ 💰 Registrar ]     │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│ 🟡  Juliana Costa                    │
│     R$ 360,00 · vencido há 12 dias   │
│  [ 💬 Cobrar ]  [ 💰 Registrar ]     │
╰──────────────────────────────────────╯
```

**Código de cores:** 🟢 em dia · 🟡 1-30 dias · 🟠 31-60 dias · 🔴 60+ dias

**Botão "Cobrar" — como funciona:**

Abre o WhatsApp nativo já no contato certo, com mensagem pré-escrita e editável. Usa
*deep link*, que funciona em Android, iOS e Web — **sem API, sem risco de banimento,
sem custo**:

```
https://wa.me/5511987654321?text=Oi%20Ana!%20Tudo%20bem%3F...
```

**Modelos de mensagem configuráveis** em Ajustes, com variáveis:

| Variável | Vira |
|---|---|
| `{nome}` | Ana Paula |
| `{valor}` | R$ 540,00 |
| `{dias}` | 47 |
| `{itens}` | lista dos atendimentos em aberto |
| `{chave_pix}` | sua chave PIX |

> Exemplo:
> *"Oi {nome}, tudo bem? 😊 Passando para lembrar do valor de {valor} referente aos nossos
> últimos atendimentos. Pode pagar no PIX {chave_pix}. Qualquer dúvida me chama!"*

**Importante:** a mensagem **não é enviada automaticamente** — o WhatsApp abre com o texto
pronto e você toca em enviar. Isso é proposital: envio automático em massa é exatamente o
comportamento que faz o WhatsApp banir números.

---

### 6.7 Despesas

**Despesas fixas** (aluguel, internet, plano de saúde, software):
- Cadastro: descrição, valor, categoria, dia de vencimento, recorrência
- No dia 1º de cada mês, um cron gera automaticamente as `despesas_ocorrencias` do mês
- Push 3 dias antes do vencimento
- Podem ser desativadas sem perder o histórico

**Despesas ocasionais** (compra de óleo, toalhas, conserto):
- Lançamento rápido: valor → categoria → descrição → salvar
- Anexo de foto do comprovante (Supabase Storage) — *sugestão*

**Categorias padrão sugeridas:**
Aluguel · Produtos e insumos · Equipamentos · Marketing · Impostos · Transporte ·
Educação · Software · Manutenção · Outros

---

## 7. Design system e UX mobile

Você pediu: *"totalmente focada na versão mobile, igual um app nativo, fluido, liso, sem
travar, arredondado"*. Isso não sai de graça — cada item abaixo existe para eliminar uma
causa específica de "cheiro de site".

### 7.1 Os 8 detalhes que separam "site no celular" de "app"

| # | Problema típico | Solução |
|---|---|---|
| 1 | Flash cinza ao tocar em botões | `-webkit-tap-highlight-color: transparent` |
| 2 | Página inteira "balança" ao rolar no fim | `overscroll-behavior: none` no `body` |
| 3 | Texto selecionado sem querer ao arrastar | `user-select: none` na UI (liberado em conteúdo) |
| 4 | Barra de endereço do Safari cortando o rodapé | `100dvh` em vez de `100vh` |
| 5 | Botão colado no gesto de home do iPhone | `env(safe-area-inset-bottom)` |
| 6 | Zoom automático ao focar input no iOS | `font-size: 16px` mínimo em todo input |
| 7 | Animação travando (jank) | Animar **só** `transform` e `opacity` — nunca `width`, `height`, `top` |
| 8 | Espera visível após cada toque | Update otimista: UI muda na hora, rede confirma depois |

### 7.2 Tokens de design

```css
:root {
  /* ── Raio: generoso, conforme pedido ───────────────── */
  --r-xs:    8px;
  --r-sm:   12px;
  --r-md:   16px;   /* botões, inputs */
  --r-lg:   20px;
  --r-xl:   24px;   /* cards */
  --r-2xl:  28px;   /* bottom sheets */
  --r-full: 9999px; /* pills, avatares, FAB */

  /* ── Paleta: clínica de massagem — calma e quente ──── */
  --bg:            #FAF8F5;   /* off-white, menos clínico que branco puro */
  --surface:       #FFFFFF;
  --surface-alt:   #F4F1EC;
  --border:        #E8E3DB;

  --text:          #1C1917;
  --text-muted:    #78716C;

  --primary:       #7C6A9E;   /* lavanda profunda — relaxamento */
  --primary-soft:  #F0EBFA;
  --accent:        #C89F7B;   /* terracota suave — calor, madeira */

  --success:       #4A7C59;   /* pago, em dia */
  --warning:       #C9853F;   /* atenção, vencendo */
  --danger:        #B54A4A;   /* vencido, cancelado */

  /* ── Sombras: suaves, nunca duras ──────────────────── */
  --shadow-sm:  0 1px 2px  rgba(28,25,23,.04);
  --shadow-md:  0 4px 12px rgba(28,25,23,.06);
  --shadow-lg:  0 12px 32px rgba(28,25,23,.10);

  /* ── Movimento ─────────────────────────────────────── */
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);   /* decelera, tipo iOS */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* leve overshoot */
  --dur-fast:   150ms;
  --dur-base:   250ms;
  --dur-slow:   400ms;

  /* ── Áreas seguras ─────────────────────────────────── */
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:          #17151A;
    --surface:     #201D24;
    --surface-alt: #2A262F;
    --border:      #332E39;
    --text:        #F5F3F0;
    --text-muted:  #A09AA8;
    --primary:     #A594C7;
    --primary-soft:#2B2436;
  }
}
```

### 7.3 Navegação

**Bottom tab bar** fixa, 5 itens, com FAB central elevado:

```
┌──────────────────────────────────────────┐
│                                          │
│              conteúdo                    │
│                                          │
├──────────────────────────────────────────┤
│                  ╭───╮                   │
│   📅      👥     │ + │     💰      ⚙️    │
│ Agenda  Clientes ╰───╯  Financeiro Mais  │
└──────────────────────────────────────────┘
        ↑ respeitando --safe-bottom
```

- Alvos de toque ≥ 44×44px (diretriz de acessibilidade da Apple)
- Ícone preenchido quando ativo, contornado quando inativo
- Vibração curta (`navigator.vibrate(10)`) ao trocar de aba
- FAB abre sheet de ação rápida: Novo agendamento / 📋 Colar do WhatsApp (§9.9-A) / Nova cliente / Nova despesa / Receber

### 7.4 Padrões de interação

| Padrão | Implementação |
|---|---|
| **Bottom sheets em vez de modais** | Vaul, com arrasto para fechar e pontos de parada (snap points) |
| **Updates otimistas** | TanStack Query `onMutate` — registrar pagamento reflete na hora, reverte se falhar |
| **Skeletons em vez de spinners** | Placeholder com a forma do conteúdo real; passa sensação de velocidade |
| **Puxar para atualizar** | Gesto nativo na agenda e no financeiro |
| **Transições de página** | Slide horizontal com springs; respeita `prefers-reduced-motion` |
| **Haptics** | `navigator.vibrate` em: concluir atendimento, registrar pagamento, erro |
| **Estados vazios** | Ilustração + texto útil + botão de ação, nunca uma lista em branco |
| **Confirmação destrutiva** | Sheet com botão vermelho, nunca `window.confirm()` |
| **Desfazer** | Toast com "Desfazer" por 5s após ações reversíveis |

### 7.5 Orçamento de performance

Metas mensuráveis, verificadas com Lighthouse mobile:

| Métrica | Meta |
|---|---|
| Largest Contentful Paint | < 1,5s em 4G |
| Interaction to Next Paint | < 100ms |
| Cumulative Layout Shift | < 0,05 |
| JS inicial (gzip) | < 120 KB |
| Taxa de quadros em animações | 60fps constante |

Técnicas: Server Components por padrão, `dynamic()` para gráficos e calendário,
`next/font` com `display: swap`, imagens em AVIF/WebP, lista virtualizada se passar de
200 clientes.

---

## 8. PWA e notificações push

### 8.1 ⚠️ A restrição mais importante do projeto: iOS

**Isto precisa ser dito antes de qualquer linha de código.**

No iPhone, Web Push para PWA funciona **apenas** quando:

1. iOS **16.4 ou superior**
2. O app foi **adicionado à Tela de Início** (via Safari → Compartilhar → Adicionar à Tela
   de Início)
3. A permissão foi concedida **de dentro do app instalado**, não do Safari

**Se abrir pelo Safari sem instalar, a notificação simplesmente não chega.** Não há
mensagem de erro, não há aviso — silêncio. É a causa nº 1 de "o push não funciona" em PWAs.

No Android/Chrome funciona normalmente, com ou sem instalação.

**Mitigação obrigatória:**
- Detectar iOS + não-instalado e mostrar um guia visual de instalação com screenshots
- Na tela de Ajustes, um **botão de teste** ("Enviar notificação de teste") que confirma
  a ponta a ponta que está funcionando
- Deixar explícito na interface quando as notificações estão inativas e por quê

> **Se isso for inaceitável**, a alternativa é um app nativo/híbrido (React Native ou
> Capacitor) usando FCM/APNs direto — mas aí entra App Store, Apple Developer Program
> ($99/ano) e processo de revisão. A recomendação é começar PWA e só migrar se a restrição
> do iOS realmente atrapalhar no uso diário.

### 8.2 Manifest

```json
{
  "name": "Clínica — Gestão",
  "short_name": "Clínica",
  "description": "Agenda, clientes e financeiro da clínica",
  "start_url": "/agenda?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FAF8F5",
  "theme_color": "#7C6A9E",
  "lang": "pt-BR",
  "dir": "ltr",
  "categories": ["business", "productivity", "health"],
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512",
      "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Novo agendamento", "url": "/agenda/novo",
      "icons": [{ "src": "/icons/add.png", "sizes": "96x96" }] },
    { "name": "Quem está devendo", "url": "/financeiro/inadimplentes",
      "icons": [{ "src": "/icons/money.png", "sizes": "96x96" }] }
  ]
}
```

### 8.3 Fluxo de inscrição em push

```typescript
// 1. Gerar par de chaves VAPID (uma vez, no terminal):
//    npx web-push generate-vapid-keys
//    → pública  vai pro .env do frontend (NEXT_PUBLIC_VAPID_PUBLIC_KEY)
//    → privada  vai pro secret da Edge Function (NUNCA no cliente)

async function ativarNotificacoes() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este navegador não suporta notificações');
  }

  // Detectar o caso iOS-não-instalado ANTES de pedir permissão
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;

  if (isIOS && !isStandalone) {
    return { erro: 'IOS_NAO_INSTALADO' };  // → mostrar guia de instalação
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return { erro: 'PERMISSAO_NEGADA' };

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,   // obrigatório; toda push deve gerar notificação visível
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    ),
  });

  await salvarSubscription(subscription);   // → tabela push_subscriptions
  return { ok: true };
}
```

### 8.4 Service Worker

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const dados = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(dados.titulo ?? 'Clínica', {
      body:  dados.corpo,
      icon:  '/icons/192.png',
      badge: '/icons/badge.png',      // monocromático, só Android
      tag:   dados.tag,               // agrupa/substitui notificações do mesmo tipo
      renotify: false,
      data:  { url: dados.url ?? '/' },
      vibrate: [80, 40, 80],
      actions: dados.acoes ?? [],     // ignorado no iOS
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((lista) => {
        // Se o app já está aberto, navega nele em vez de abrir outra janela
        for (const cliente of lista) {
          if ('focus' in cliente) {
            cliente.navigate(destino);
            return cliente.focus();
          }
        }
        return clients.openWindow(destino);
      })
  );
});
```

### 8.5 Catálogo de notificações

| # | Tipo | Quando dispara | Exemplo |
|---|---|---|---|
| 1 | Lembrete de atendimento | 1h antes | *"Em 1h: Maria Silva — Relaxante 60min"* |
| 2 | Resumo do dia | 07:00 | *"Hoje: 6 atendimentos, R$ 1.080 previstos"* |
| 3 | Cobrança pendente | 09:00, se >15 dias | *"3 clientes devendo há mais de 15 dias — R$ 940"* |
| 4 | Despesa vencendo | 3 dias antes | *"Aluguel de R$ 1.200 vence em 3 dias"* |
| 5 | Pacote expirando | 7 dias antes | *"Pacote da Ana expira em 7 dias — 3 sessões não usadas"* |
| 6 | Fechamento semanal | Domingo 20:00 | *"Semana: R$ 2.840 entradas, R$ 620 saídas"* |
| 7 | Cliente inativa | 09:00, se >60 dias | *"5 clientes sem retorno há mais de 60 dias"* |
| 8 | Aniversário | 08:00 | *"🎂 Hoje é aniversário da Juliana"* |
| 9 | Sugestões da IA | Ao concluir análise | *"12 informações extraídas, aguardando revisão"* |
| 10 | Conflito de horário detectado | Imediato, ao concluir análise | *"🔴 Ana Paula e Juliana marcadas na mesma terça 15h — resolver"* |
| 11 | Lembrete de conciliação semanal | Domingo 19:00 | *"Revisar conversas da semana no WhatsApp? Leva 2 min"* |

A notificação nº 10 é a única com prioridade alta/imediata — as demais respeitam o horário
configurado, mas um conflito de horário afeta o próximo atendimento e não pode esperar o
próximo ciclo do resumo diário. Cada tipo é **ligável/desligável** individualmente em
Ajustes, com horário configurável.

### 8.6 Agendamento com pg_cron

```sql
-- Verifica e envia notificações pendentes a cada 5 minutos
select cron.schedule(
  'enviar-notificacoes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://<projeto>.supabase.co/functions/v1/enviar-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Resumo diário às 07:00 (BRT = UTC-3, então 10:00 UTC)
select cron.schedule('resumo-diario', '0 10 * * *', $$ ... $$);

-- Gerar ocorrências de despesas fixas todo dia 1º às 00:05
select cron.schedule('gerar-despesas-fixas', '5 3 1 * *', $$ ... $$);

-- Marcar pacotes expirados, diariamente
select cron.schedule('expirar-pacotes', '0 6 * * *', $$
  update pacotes set status = 'expirado'
  where status = 'ativo' and validade < current_date;
$$);
```

> ⚠️ **`pg_cron` usa UTC.** Brasília é UTC−3. Para disparar às 07:00 BRT, agende `0 10 * * *`.
> Um erro aqui manda notificação às 4 da manhã. Vale um comentário em cada cron registrando
> o horário local pretendido.

### 8.7 ⚠️ Ponto de atenção técnico: `web-push` no Deno

A biblioteca `web-push` do Node depende de APIs de criptografia que nem sempre funcionam
direto em Edge Functions (Deno). Existem três caminhos:

1. **`npm:web-push`** — Supabase Edge Functions suportam especificadores npm. Funciona na
   maioria dos casos, mas precisa ser validado.
2. **`@negrel/webpush`** — biblioteca nativa de Deno, usa Web Crypto API. Mais confiável
   nesse ambiente.
3. **Route Handler do Next.js na Vercel** — roda em Node de verdade, `web-push` funciona
   sem atrito. O cron do Supabase chamaria a URL da Vercel em vez da Edge Function.

**Recomendação:** fazer um *spike* de 2 horas na **Fase 0** testando a opção 1. Se falhar,
ir para a 2. A opção 3 é o plano de contingência garantido. Esse é o único risco técnico
real do projeto — resolver cedo evita retrabalho.

---

## 9. IA — Análise de conversas do WhatsApp

### 9.1 O problema

Hoje a informação está toda espalhada em centenas de conversas:

> — *"Oi, posso marcar terça às 15h?"*
> — *"Já fiz o pix de 180 😊"*
> — *"Vou pegar o pacote de 10, pode ser?"*
> — *"Depois te pago as duas últimas, pode ser?"*

O objetivo é transformar isso em registros estruturados no banco: agendamentos, pagamentos,
dívidas e pacotes.

**Este módulo tem dois papéis, não um só:**

1. **Backfill histórico** — importar o passado uma vez, na Fase 5, para começar o app com
   dados reais em vez de do zero.
2. **Rede de segurança contínua** — este é o papel mais importante na prática. A pessoa que
   vai operar o app no dia a dia (no caso, sua mãe) vai, às vezes, **fechar um horário
   diretamente pelo WhatsApp e esquecer de lançar no app.** Isso não é uma exceção rara — é
   o padrão real de uso que qualquer sistema precisa assumir desde o design, não tratar como
   bug do usuário.

   O risco concreto: ela combina com a Ana Paula terça às 15h pelo WhatsApp, sem lançar no
   app. Depois, alguém (você, ou ela mesma pelo app) marca a Juliana no mesmo horário —
   porque, para o sistema, aquele slot está livre. As duas chegam terça às 15h.

   Por isso o pipeline abaixo não pode só *evitar duplicar* o que já está no banco — ele
   precisa **cruzar ativamente com a agenda existente** e alertar sobre dois casos
   diferentes: agendamento mencionado no WhatsApp que não existe no app (falta lançar), e
   agendamento mencionado no WhatsApp que **conflita** com um horário já ocupado por outra
   cliente (alguém vai precisar remarcar). Ver §9.3 passo 6 e §9.9.

### 9.2 A regra mais importante: a IA nunca escreve direto no banco

```
Conversa → Extração pela IA → FILA DE SUGESTÕES → Aprovação humana → Banco
                                      ▲
                          A IA para aqui. Sempre.
```

**Por quê:** modelos de linguagem erram, e erro em registro financeiro é o pior tipo de erro
— silencioso e acumulativo. Se a IA interpretar *"depois eu pago"* como pagamento
confirmado, o saldo da cliente fica errado e ninguém percebe por meses.

Cada fato extraído vira um **card de sugestão** com:
- O que foi entendido (já formatado como o registro ficaria)
- **O trecho literal da conversa** que embasa aquilo
- Um score de confiança (0-100%)
- Botões: ✅ Aprovar · ✏️ Editar e aprovar · ❌ Rejeitar

Sugestões com confiança < 70% vêm com aviso visual destacado.

### 9.3 Pipeline completo

```
┌────────────────────────────────────────────────────────────┐
│ 1. INGESTÃO                                                │
│    WhatsApp → Conversa → ⋮ → Exportar conversa → Sem mídia │
│    Gera um .txt. Usuária faz upload no app.                │
│    Não é só backfill: virar hábito semanal é o que faz     │
│    a "rede de segurança" (§9.1) funcionar de verdade —     │
│    ver lembrete recorrente em §8.5.                        │
│    (Fase 2: webhook de API — ver §9.7)                     │
└──────────────────────┬─────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 2. PARSING                                                 │
│    Formato BR: "22/09/2026 14:30 - Maria: Oi!"             │
│    Formato alt: "[22/09/2026, 14:30:05] Maria: Oi!"        │
│    → normaliza em [{data, autor, texto}]                   │
│    → remove "<Mídia oculta>", "Mensagem apagada"           │
└──────────────────────┬─────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 3. VINCULAÇÃO DE CLIENTE                                   │
│    a) telefone do arquivo → match exato em clientes        │
│    b) nome do contato → match fuzzy (pg_trgm, similarity)  │
│    c) sem match → usuária escolhe ou cria cliente          │
└──────────────────────┬─────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 4. CHUNKING                                                │
│    Conversas longas → janelas de ~25k tokens com           │
│    sobreposição de 10 mensagens (preserva contexto que     │
│    cruza a fronteira do chunk)                             │
└──────────────────────┬─────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 5. EXTRAÇÃO — Claude claude-opus-5                         │
│    Saída estruturada validada por schema Zod               │
│    Prompt caching no system prompt (economia ~90%)         │
└──────────────────────┬─────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 6. DEDUPLICAÇÃO E CONCILIAÇÃO COM A AGENDA                 │
│    Cruza com o que já existe no banco.                     │
│    Não sugere pagamento que já foi registrado.              │
│    Para agendamentos: checa sobreposição de horário contra  │
│    a agenda real (§9.9) → classifica como "faltando          │
│    lançar" ou "conflito com outra cliente".                 │
└──────────────────────┬─────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 7. FILA DE REVISÃO  ← humana aprova aqui                   │
│    Conflitos de horário aparecem no topo, com selo 🔴      │
└──────────────────────┬─────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 8. APLICAÇÃO — vira registro real, em transação            │
│    A constraint sem_sobreposicao (§5.3) é a última trava:  │
│    aprovar um conflito real falha com erro claro em vez de  │
│    criar um double-booking silencioso.                     │
└────────────────────────────────────────────────────────────┘
```

### 9.4 Escolha do modelo

| Modelo | Entrada $/1M | Saída $/1M | Uso no projeto |
|---|---|---|---|
| **`claude-opus-5`** | $5,00 | $25,00 | **Padrão.** Melhor em nuance, ambiguidade e português coloquial |
| `claude-sonnet-5` | $2,00 | $10,00 | Opcional para reprocessamento em massa, se o custo pesar |

Por que Opus e não um modelo mais barato: a tarefa parece simples ("extrair valores") mas na
prática é cheia de armadilhas linguísticas — ironia, negação, condicional, gíria regional,
áudio transcrito mal. Distinguir *"vou pagar"* de *"paguei"* de *"pago semana que vem"* é
exatamente onde a diferença de capacidade aparece. Errar aqui custa mais do que os
centavos economizados.

**Estimativa de custo por cliente:**
```
Conversa de 1 ano  ≈ 15.000 tokens entrada
Extração           ≈  2.000 tokens saída

Entrada: 15.000 × $5,00/1M  = $0,075
Saída:    2.000 × $25,00/1M = $0,050
─────────────────────────────────────
Total por cliente           ≈ $0,125  (~R$ 0,68)
```

Com **prompt caching** no system prompt (que é idêntico em toda chamada), o custo cai
significativamente em lote. Com a **Batch API**, cai mais 50%.

### 9.5 Schema de extração

```typescript
import { z } from "zod";

const Confianca = z.number().min(0).max(1)
  .describe("Certeza da extração. Use <0.7 quando houver qualquer ambiguidade.");

const Evidencia = z.string()
  .describe("Trecho LITERAL da conversa que embasa esta extração. Nunca parafraseie.");

const AgendamentoExtraido = z.object({
  data_mencionada:   z.string().nullable().describe("ISO 8601, ou null se não houver data clara"),
  horario:           z.string().nullable(),
  servico_mencionado: z.string().nullable(),
  confirmado:        z.boolean().describe("true só se houve confirmação explícita das duas partes"),
  cancelado:         z.boolean(),
  confianca:         Confianca,
  evidencia:         Evidencia,
});

const PagamentoExtraido = z.object({
  valor_reais: z.number().nullable(),
  metodo:      z.enum(["pix","dinheiro","cartao_credito","cartao_debito","transferencia","nao_especificado"]),
  data_mencionada: z.string().nullable(),
  // ↓ a distinção mais importante de todo o schema
  efetivado: z.boolean()
    .describe("true APENAS se o pagamento JÁ FOI feito ('paguei', 'mandei o pix', 'tá pago'). " +
              "false para promessas futuras ('vou pagar', 'pago amanhã', 'semana que vem eu acerto')."),
  confianca: Confianca,
  evidencia: Evidencia,
});

const DividaExtraida = z.object({
  valor_reais:     z.number().nullable(),
  motivo:          z.string(),
  data_mencionada: z.string().nullable(),
  reconhecida_pela_cliente: z.boolean(),
  confianca:       Confianca,
  evidencia:       Evidencia,
});

const PacoteExtraido = z.object({
  servicos_mencionados: z.array(z.object({
    nome: z.string(),
    quantidade: z.number().int().nullable(),
  })),
  valor_total_reais: z.number().nullable(),
  desconto_mencionado: z.string().nullable(),
  fechado: z.boolean().describe("true se a cliente confirmou a compra"),
  confianca: Confianca,
  evidencia: Evidencia,
});

const ObservacaoExtraida = z.object({
  categoria: z.enum(["saude","preferencia","alergia","restricao","pessoal"]),
  conteudo:  z.string(),
  confianca: Confianca,
  evidencia: Evidencia,
});

export const ResultadoAnalise = z.object({
  resumo_conversa:  z.string().describe("2-3 frases sobre o relacionamento com esta cliente"),
  agendamentos:     z.array(AgendamentoExtraido),
  pagamentos:       z.array(PagamentoExtraido),
  dividas:          z.array(DividaExtraida),
  pacotes:          z.array(PacoteExtraido),
  observacoes:      z.array(ObservacaoExtraida),
  alertas: z.array(z.string())
    .describe("Ambiguidades ou conflitos que a humana precisa resolver"),
});
```

### 9.6 Implementação da chamada

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ResultadoAnalise } from "./schema";

const client = new Anthropic();

const SYSTEM_PROMPT = `Você analisa conversas de WhatsApp entre uma massoterapeuta brasileira e suas clientes, extraindo informações de negócio.

CONTEXTO
- A massoterapeuta é quem aparece como "${NOME_PROFISSIONAL}" na conversa.
- Serviços oferecidos: ${CATALOGO_SERVICOS}
- Data de hoje: ${HOJE}
- Todos os valores são em Reais (R$).

REGRAS DE EXTRAÇÃO

1. TEMPO VERBAL É DECISIVO NO CAMPO \`efetivado\`.
   "já fiz o pix"      → efetivado: true
   "acabei de mandar"  → efetivado: true
   "tá pago"           → efetivado: true
   "vou fazer o pix"   → efetivado: false
   "te pago amanhã"    → efetivado: false
   "semana que vem eu acerto" → efetivado: false
   Na dúvida entre passado e futuro, use false e confianca < 0.6.

2. DATAS RELATIVAS: resolva usando a data da mensagem, não a data de hoje.
   "terça que vem" em uma mensagem de 20/09/2026 (domingo) → 29/09/2026.
   Se a resolução for ambígua, deixe null e registre em \`alertas\`.

3. EVIDÊNCIA É OBRIGATÓRIA E LITERAL.
   Copie o trecho exato. Nunca parafraseie, nunca resuma, nunca corrija a grafia.

4. NÃO INFIRA O QUE NÃO ESTÁ ESCRITO.
   Se a conversa não menciona valor, deixe null. Não estime com base no catálogo.

5. CONFIANÇA COM HONESTIDADE.
   0.9-1.0 → explícito e sem ambiguidade
   0.7-0.9 → claro, mas com algum detalhe implícito
   0.4-0.7 → interpretação plausível, mas contestável
   < 0.4   → palpite. Prefira não extrair e registrar em \`alertas\`.

6. PORTUGUÊS COLOQUIAL BRASILEIRO.
   Abreviações ("vc", "bj", "blz", "pfv"), erros de digitação, áudios transcritos
   com falhas e emojis fazem parte. Interprete com naturalidade.

7. IRONIA E NEGAÇÃO.
   "nem paguei ainda kkk" NÃO é pagamento efetivado.
   "não vai dar terça" é cancelamento, não agendamento.`;

export async function analisarConversa(conversa: string, meta: MetaConversa) {
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },   // raciocínio adaptativo para casos ambíguos
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },   // ← reaproveitado entre clientes
      },
    ],
    messages: [
      {
        role: "user",
        content: `Cliente: ${meta.nomeContato}\nPeríodo: ${meta.inicio} a ${meta.fim}\n\n--- CONVERSA ---\n${conversa}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(ResultadoAnalise),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Falha ao validar saída estruturada");
  }

  return {
    dados: response.parsed_output,
    uso: {
      entrada: response.usage.input_tokens,
      saida:   response.usage.output_tokens,
      cache:   response.usage.cache_read_input_tokens,
    },
  };
}
```

**Pontos técnicos:**
- `messages.parse()` valida a resposta contra o schema Zod automaticamente
- `cache_control` no system prompt: ele é idêntico em todas as chamadas, então a partir da
  segunda análise o custo daquela parte cai drasticamente
- `thinking: { type: "adaptive" }`: o modelo raciocina mais quando a conversa é ambígua e
  menos quando é trivial
- `parsed_output` pode vir `null` — sempre checar antes de usar

### 9.7 Ingestão automática (Fase 2 — opcional)

| Método | Custo | Risco | Esforço |
|---|---|---|---|
| **Upload manual de .txt** | Grátis | ✅ Nenhum | Baixo |
| **WhatsApp Cloud API (oficial, Meta)** | ~$0,005/conversa | ✅ Nenhum | Alto — exige verificação do Meta Business |
| **Evolution API (não-oficial)** | VPS ~$5/mês | ⚠️ **Risco de banimento do número** | Médio |

**Recomendação forte:** começar com upload manual. É grátis, não tem risco, e cobre 100%
do caso de uso de análise histórica.

Sobre a **Evolution API**: é muito popular no Brasil e funciona bem, mas ela simula um
WhatsApp Web conectado ao seu número pessoal. O WhatsApp não autoriza isso, e banimentos
acontecem. **Perder o número de trabalho seria um dano muito maior do que a conveniência
da automação.** Se for seguir esse caminho, use um chip dedicado, nunca o número principal.

Dado o padrão de uso real (§9.1 — marcar direto pelo WhatsApp), vale reforçar: a solução
mais eficaz para o problema de "esquecer de lançar" **não é automação de ingestão**, é
reduzir o atrito de lançar na hora — ver "Colar do WhatsApp" em §9.9. Automação de ingestão
resolve um sintoma; captura rápida resolve a causa, sem nenhum dos riscos acima.

### 9.8 Tela de revisão de sugestões

```
╭──────────────────────────────────────╮
│  Sugestões da IA              12     │
│  Maria Silva · analisado há 2 min    │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│  💰 PAGAMENTO            ●●●●○ 87%   │
│                                      │
│  R$ 180,00 via PIX                   │
│  em 15/09/2026                       │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ "oi, já fiz o pix de 180 😊" │    │
│  │            15/09/2026 09:14  │    │
│  └──────────────────────────────┘    │
│                                      │
│  [ ✅ Aprovar ] [ ✏️ ] [ ❌ ]         │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│  ⚠️ PAGAMENTO            ●●○○○ 45%   │
│                                      │
│  R$ 200,00 · método não especificado │
│                                      │
│  ⚠️ Confiança baixa — pode ser        │
│     promessa, não pagamento feito    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ "te acerto os 200 essa       │    │
│  │  semana sem falta"           │    │
│  │            18/09/2026 20:41  │    │
│  └──────────────────────────────┘    │
│                                      │
│  [ ✅ Aprovar ] [ ✏️ ] [ ❌ ]         │
╰──────────────────────────────────────╯

  [ Aprovar todas acima de 85% ]
```

### 9.9 Conciliação com a agenda real

Esta seção existe por causa de um detalhe operacional importante: quem opera o app no dia a
dia vai, às vezes, fechar horário direto pelo WhatsApp sem lançar no app (§9.1). O módulo de
IA precisa lidar com isso em duas frentes complementares — uma que ataca a causa (reduzir o
atrito de lançar na hora) e outra que ataca o sintoma (detectar depois o que passou batido).

#### A. "Colar do WhatsApp" — captura rápida, em tempo real

A forma mais eficaz de evitar o esquecimento não é analisar a conversa inteira depois — é
tornar o lançamento tão rápido quanto responder no WhatsApp. Nova ação no FAB (§6.1):

```
FAB (+) → 📋 Colar do WhatsApp
  1. Cola o texto da mensagem (ou algumas mensagens seguidas)
  2. Toque em "Analisar" → 1 chamada rápida à IA (só esse trecho,
     sem chunking, resposta em ~2s)
  3. Sheet de "Novo agendamento" abre JÁ PREENCHIDA:
     cliente (com match automático), serviço, data, horário
  4. Confere e toca em "Criar" — mesmo fluxo de 5 toques de sempre,
     só que sem digitar nada
```

Tecnicamente é a mesma chamada de `analisarConversa` (§9.6), só que com uma janela de poucas
mensagens em vez do histórico inteiro — mais barato ainda (frações de centavo) e rápido o
suficiente para rodar de forma síncrona, sem fila de revisão. Como o resultado só *preenche
um formulário que a humana ainda confirma*, não fere a regra do §9.2.

**Se o horário colidir com outra cliente**, a sheet mostra o conflito na hora, antes mesmo de
tentar salvar — não espera o erro do banco:

```
╭──────────────────────────────────────╮
│  ⚠️  Horário ocupado                 │
│                                      │
│  Terça 24/09, 15:00 já está com      │
│  Juliana Costa (Drenagem 50min)      │
│                                      │
│  [ Ver agenda ]   [ Escolher outro ] │
╰──────────────────────────────────────╯
```

#### B. Reconciliação em lote — a rede de segurança para o que passou batido

Mesmo com a captura rápida, alguma coisa vai escapar. A importação de conversa (§9.3) trata
isso com uma etapa de conciliação além da deduplicação normal: para cada agendamento
extraído, cruza contra a agenda real usando o mesmo intervalo de tempo da constraint
`sem_sobreposicao` (§5.3):

```sql
-- Pseudo-lógica do passo 6 do pipeline, por agendamento extraído
select id, cliente_id, inicio, fim
from agendamentos
where status in ('agendado','confirmado','concluido')
  and tstzrange(inicio, fim) && tstzrange(:inicio_extraido, :fim_extraido);
```

| Resultado da checagem | Tipo de sugestão | Selo na fila (§9.8) |
|---|---|---|
| Nenhum agendamento no intervalo, e menciona confirmação | `agendamento_faltando` | 🟡 "Não está na agenda" |
| Já existe um agendamento igual (mesma cliente, mesmo horário) | descartado (deduplicação) | — não aparece |
| Existe agendamento no intervalo com **outra cliente** | `conflito_horario` | 🔴 no topo da fila, antes de tudo |

Cards de exemplo na fila de revisão:

```
╭──────────────────────────────────────╮
│  🔴 CONFLITO DE HORÁRIO   ●●●●○ 82%  │
│                                      │
│  Ana Paula pediu terça 24/09, 15h    │
│  → já ocupado por Juliana Costa      │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ "pode ser terça as 15?"      │    │
│  │            22/09/2026 11:02  │    │
│  └──────────────────────────────┘    │
│                                      │
│  [ 📅 Resolver na agenda ]  [ ❌ ]   │
╰──────────────────────────────────────╯

╭──────────────────────────────────────╮
│  🟡 AGENDAMENTO NÃO LANÇADO ●●●●● 94%│
│                                      │
│  Maria Silva · Relaxante 60min       │
│  Quinta 26/09, 10h                   │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ "combinado, quinta 10h então"│    │
│  │            21/09/2026 16:30  │    │
│  └──────────────────────────────┘    │
│                                      │
│  [ ✅ Adicionar à agenda ] [ ❌ ]    │
╰──────────────────────────────────────╯
```

Conflitos (🔴) não têm botão de "Aprovar" direto — aprovar cegamente criaria o double-booking
que estamos tentando evitar. O botão leva para a agenda, no horário em questão, para decidir
manualmente quem fica e quem é remarcada.

#### C. Hábito de reconciliação

Captura rápida cobre o caso ideal; ainda assim vale um lembrete recorrente para revisar
conversas da semana (notificação nº 10 em §8.5) — pensado como uma rede de segurança de
segunda camada, não como o mecanismo principal.

---

## 10. Segurança, LGPD e backup

### 10.1 Autenticação

- Supabase Auth com e-mail + senha
- Sessão longa (30 dias) — é um app pessoal no celular da dona, pedir login toda hora é atrito
- Opção de **bloqueio biométrico** local (WebAuthn) ao reabrir o app — *sugestão*, protege
  dados de saúde caso o celular seja emprestado ou perdido

### 10.2 Row Level Security

**Toda tabela com RLS ativa.** No Supabase, esquecer RLS em uma tabela significa que
qualquer pessoa com a chave anônima (que é pública, vai no bundle do frontend) lê tudo.

```sql
alter table clientes enable row level security;

create policy "usuarios autenticados acessam clientes"
  on clientes for all
  to authenticated
  using (true)
  with check (true);

-- Repetir para TODAS as tabelas. Sem exceção.
```

Quando houver múltiplas profissionais, as policies mudam para filtrar por `user_id`
ou por papel.

### 10.3 Gestão de segredos

| Segredo | Onde vive | Nunca |
|---|---|---|
| `SUPABASE_ANON_KEY` | Frontend (público por design) | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions / server | ❌ Jamais no cliente — ignora RLS |
| `VAPID_PRIVATE_KEY` | Edge Function secret | ❌ Jamais no cliente |
| `ANTHROPIC_API_KEY` | Server-side apenas | ❌ Jamais no cliente |

Chamadas à Claude API sempre passam por um Route Handler ou Edge Function. Uma chave da
Anthropic exposta no bundle do frontend é gasto ilimitado na conta de quem achar.

### 10.4 LGPD

O app armazena **dados pessoais sensíveis** (saúde: restrições, alergias) e **conversas
privadas**. A LGPD trata dados de saúde como categoria especial, com proteção reforçada.

**Obrigações práticas:**

| Requisito | Implementação |
|---|---|
| Base legal | Execução de contrato (art. 7º, V) para dados de atendimento; consentimento para conversas |
| Minimização | Não importar conversas de quem não é cliente |
| Retenção | Política de expurgo: conversas analisadas podem ser apagadas após extração |
| Direito de acesso | Botão "Exportar dados da cliente" (JSON/PDF) na ficha |
| Direito de exclusão | Exclusão permanente disponível, com anonimização do histórico financeiro |
| Segurança | Criptografia em repouso (Supabase faz) e em trânsito (HTTPS) |
| Registro | Tabela `auditoria` como log de tratamento |

**Recomendação:** avisar as clientes, mesmo informalmente, que as conversas são usadas para
organizar os atendimentos. É baixo custo e cobre o ponto do consentimento.

### 10.5 Backup

O Supabase Pro faz backup diário automático com 7 dias de retenção — mas isso protege contra
falha da infra, **não contra exclusão acidental** percebida depois de 8 dias.

**Camada extra recomendada:**
```sql
-- Cron semanal: exporta dados críticos para o Storage
select cron.schedule('backup-semanal', '0 5 * * 0', $$ ... $$);
```
Mais um lembrete mensal para baixar uma cópia local. Dados financeiros de 2 anos não têm
preço de reposição.

---

## 11. Roadmap por fases

Cada fase entrega algo **utilizável**. A ideia é você já estar usando o app na Fase 2, não
esperar 3 meses pelo produto completo.

### Fase 0 — Fundação (3-5 dias)

- [ ] Criar projeto Next.js 15 + TypeScript + Tailwind v4
- [ ] Criar projeto Supabase (plano Pro desde o início)
- [ ] Aplicar migrations do schema (§5.3)
- [ ] Configurar RLS em todas as tabelas
- [ ] Setup de auth e tela de login
- [ ] Deploy inicial na Vercel com domínio
- [ ] 🔬 **Spike crítico: validar `web-push` em Edge Function** (§8.7)
- [ ] Gerar chaves VAPID e configurar secrets

> A fase termina com um app vazio no ar, com login funcionando e o risco técnico resolvido.

### Fase 1 — Núcleo operacional (2 semanas)

- [ ] Design system: tokens, componentes base (Button, Input, Sheet, Card, Chip)
- [ ] Bottom tab bar + FAB + navegação
- [ ] CRUD de clientes com busca fuzzy
- [ ] Ficha da cliente (abas Resumo, Histórico, Saúde)
- [ ] CRUD de serviços com reordenação
- [ ] Agenda: visualizações dia/semana/mês
- [ ] Criar/editar/cancelar agendamento
- [ ] Cálculo de slots livres
- [ ] Ações rápidas por swipe

> ✅ **Marco: já dá para largar a agenda de papel.**

### Fase 2 — Financeiro (1,5 semana)

- [ ] Geração automática de cobrança ao concluir atendimento (trigger)
- [ ] Registro de pagamentos (inclusive parciais)
- [ ] Cadastro de despesas fixas e ocasionais
- [ ] Cron de geração de ocorrências mensais
- [ ] Dashboard financeiro com gráficos
- [ ] Tela de inadimplentes
- [ ] Botão de cobrança via deep link do WhatsApp
- [ ] Modelos de mensagem configuráveis

> ✅ **Marco: controle financeiro completo, planilha aposentada.**

### Fase 3 — Pacotes (1 semana)

- [ ] Construtor de pacotes com rateio de desconto
- [ ] Consumo de crédito no agendamento
- [ ] Triggers de controle de saldo
- [ ] Barra de progresso na ficha da cliente
- [ ] Expiração automática
- [ ] Modelos de pacote reutilizáveis

### Fase 4 — PWA e notificações (1 semana)

- [ ] Manifest + ícones + splash screens
- [ ] Service Worker com Serwist
- [ ] Fluxo de inscrição em push
- [ ] Guia de instalação para iOS (crítico — §8.1)
- [ ] Edge Function de envio
- [ ] Crons das 9 notificações
- [ ] Tela de preferências de notificação
- [ ] Botão de teste de notificação
- [ ] Cache offline para leitura da agenda

> ✅ **Marco: app instalado na tela inicial, notificações chegando.**

### Fase 5 — IA WhatsApp — **CANCELADA**

> Decisão: o cadastro de agendamentos a partir de conversas do WhatsApp vai continuar
> manual (fluxo já coberto pelo "Novo agendamento" da Fase 1). O desenho abaixo (§9) fica
> só como registro do que foi considerado, sem trabalho pendente associado.

### Fase 6 — Polimento (1 semana)

- [ ] Auditoria de performance (Lighthouse, metas da §7.5)
- [ ] Dark mode
- [ ] Relatórios avançados e exportação CSV/PDF
- [ ] Modo offline com fila de sincronização
- [ ] Backup automático extra
- [ ] Acessibilidade (contraste, leitores de tela, reduced motion)
- [ ] Onboarding para primeiro uso

**Total estimado: 8-9 semanas** de desenvolvimento focado.

---

## 12. Riscos e pontos de atenção

### 12.1 🔴 Alto — Push no iOS

Detalhado em §8.1. **Mitigação:** guia de instalação obrigatório + botão de teste +
indicador visual de status. Validar em um iPhone real na Fase 4, não confiar em simulador.

### 12.2 🔴 Alto — Banimento do WhatsApp

Usar API não-oficial (Evolution/Baileys) ou enviar mensagens em massa pode banir o número.
**Mitigação:** no MVP, só deep links (`wa.me`) disparados manualmente — comportamento
indistinguível de uso normal. Nenhum envio automático.

### 12.3 🟡 Médio — IA extrair informação errada

**Mitigação:** aprovação humana obrigatória (§9.2), evidência literal sempre visível,
score de confiança, nunca escrita direta no banco.

### 12.4 🟡 Médio — `web-push` no ambiente Deno

**Mitigação:** spike na Fase 0, com dois planos de contingência (§8.7).

### 12.5 🟡 Médio — Fuso horário

Agendamento às 14h que aparece às 11h é um bug clássico e constrangedor.
**Mitigação:** armazenar sempre `timestamptz` (UTC), converter só na exibição,
`pg_cron` sempre em UTC com comentário do horário local, testes com datas de mudança
de horário.

### 12.6 🟢 Baixo — Crescimento de custo com IA

**Mitigação:** painel de tokens, limite mensal configurável, prompt caching, Batch API
para volume.

### 12.7 🟢 Baixo — Perda de dados

**Mitigação:** backup do Supabase + exportação semanal para Storage + lembrete mensal de
cópia local.

---

## 13. Melhorias sugeridas (além do pedido)

Você pediu para incrementar. Organizei por relação custo-benefício:

### 13.1 Alto valor, baixo esforço

| # | Melhoria | Por quê |
|---|---|---|
| 1 | **Ficha de anamnese** (restrições, alergias) | Em massoterapia é questão de segurança. Atender alguém com hérnia de disco sem saber é risco real |
| 2 | **Notas de sessão** | "Ela reclamou de tensão no trapézio" — melhora muito o atendimento seguinte |
| 3 | **Soft delete de clientes** | Já detalhado em §5.1. Evita destruir histórico financeiro |
| 4 | **Snapshot de preços** | Sem isso, aumentar preço reescreve o passado |
| 5 | **Aniversários** | Mensagem de parabéns é a ação de fidelização mais barata que existe |
| 6 | **Modelos de mensagem** | Cobrar fica menos constrangedor com um texto pronto e educado |
| 7 | **Dark mode** | App usado à noite, em ambiente de luz baixa (é uma clínica de relaxamento) |
| 8 | **Atalhos do app** | Toque longo no ícone → "Novo agendamento" direto |

### 13.2 Alto valor, esforço médio

| # | Melhoria | Por quê |
|---|---|---|
| 9 | **Clientes inativas** (sem retorno há 60d) | Reconquistar cliente antiga custa muito menos que achar nova |
| 10 | **Taxa de ocupação da agenda** | Mostra se o problema é preço ou volume |
| 11 | **Modo offline** | Elevador, subsolo, sinal ruim — a agenda precisa abrir mesmo assim |
| 12 | **Confirmação de agendamento via WhatsApp** | Deep link com "Confirma amanhã 14h?" reduz faltas |
| 13 | **Lista de espera** | Cancelou? O app sugere quem chamar para preencher o horário |
| 14 | **Exportação contábil (CSV/PDF)** | Contador vai pedir |
| 15 | **Foto de comprovante em despesas** | Organização fiscal |
| 16 | **Metas mensais** | Barra de progresso de faturamento motiva |

### 13.3 Valor futuro

| # | Melhoria | Quando |
|---|---|---|
| 17 | **Múltiplas profissionais + comissões** | Se contratar alguém |
| 18 | **Bloqueio biométrico** | Se o celular for compartilhado |
| 19 | **Portal da cliente** (agendamento self-service) | Se o volume crescer muito |
| 20 | **Integração com Google Calendar** | Se usar agenda externa |
| 21 | **IA sugerindo horários** com base em padrões | Depois de 1 ano de dados |
| 22 | **Análise de sentimento** das conversas | Detectar cliente insatisfeita antes de perder |

---

## 14. Decisões pendentes

Pontos que precisam da sua resposta antes ou durante a Fase 0:

| # | Pergunta | Impacto |
|---|---|---|
| 1 | **Qual celular sua mãe usa no dia a dia — iPhone ou Android?** (ela é quem vai operar o app na prática, §9.1) | Define a prioridade do trabalho com a restrição do iOS (§8.1). Se for Android, o risco cai muito |
| 1b | **Sua mãe tem login próprio, ou vocês usam a mesma conta?** | Login próprio permite saber quem aprovou cada sugestão da IA (§9.8) e ajustar a UI ao nível de familiaridade dela com apps — vale simplificar ainda mais o fluxo de "Colar do WhatsApp" (§9.9-A) se for o caso |
| 2 | **É só vocês duas atendendo, ou tem outras profissionais?** | Muda o modelo de permissões e adiciona comissões |
| 3 | **Você já tem um sistema/planilha com dados?** | Precisamos de um importador na Fase 1 |
| 4 | **Quantas clientes ativas, aproximadamente?** | Define se precisa de lista virtualizada e o custo do backfill de IA |
| 5 | **Quer o nome da clínica/marca no app?** | Influencia paleta, logo e ícones |
| 6 | **Atende em local fixo, domicílio, ou ambos?** | Domicílio exige campo de endereço e tempo de deslocamento na agenda |
| 7 | **Aceita pagamento parcelado?** | Já está previsto no modelo, mas muda a interface de cobrança |
| 8 | **Quer começar por qual fase?** | Podemos reordenar — ex: financeiro antes da agenda |

---

## Apêndice A — Estrutura de pastas

```
clinica/
├── app/
│   ├── (auth)/login/
│   ├── (app)/
│   │   ├── agenda/
│   │   │   ├── page.tsx
│   │   │   ├── [data]/page.tsx
│   │   │   └── novo/page.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── financeiro/
│   │   │   ├── page.tsx
│   │   │   ├── inadimplentes/page.tsx
│   │   │   ├── despesas/page.tsx
│   │   │   └── pacotes/page.tsx
│   │   ├── ia/
│   │   │   ├── page.tsx
│   │   │   └── sugestoes/page.tsx
│   │   ├── ajustes/
│   │   └── layout.tsx          # bottom tab bar
│   ├── api/
│   │   ├── ia/analisar/route.ts
│   │   └── push/subscribe/route.ts
│   ├── manifest.ts
│   └── layout.tsx
│
├── components/
│   ├── ui/                     # Button, Input, Sheet, Card, Chip, Skeleton
│   ├── agenda/                 # TimelineDia, GradeSemana, CardAgendamento
│   ├── clientes/
│   ├── financeiro/
│   └── ia/
│
├── lib/
│   ├── supabase/               # client, server, middleware
│   ├── anthropic/              # cliente, schemas, prompts
│   ├── whatsapp/               # parser de export, deep links
│   ├── push/
│   ├── dinheiro.ts             # formatação e aritmética em centavos
│   └── datas.ts                # helpers de fuso
│
├── hooks/                      # useAgenda, useClientes, useFinanceiro
├── types/                      # gerados do schema Supabase
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   ├── enviar-push/
│   │   ├── processar-ia/
│   │   └── gerar-despesas/
│   └── seed.sql
│
├── public/
│   ├── icons/
│   └── sw.js
│
└── PLANO.md                    # este documento
```

## Apêndice B — Variáveis de ambiente

```bash
# ── Público (vai no bundle do frontend) ─────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
NEXT_PUBLIC_APP_URL=https://clinica.com.br

# ── Servidor apenas (NUNCA prefixar com NEXT_PUBLIC_) ───
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:contato@clinica.com.br

# ── Configuração ────────────────────────────────────────
TZ=America/Sao_Paulo
```

## Apêndice C — Comandos iniciais

```bash
# Projeto
npx create-next-app@latest clinica --typescript --tailwind --app --src-dir=false

cd clinica

# Dependências principais
npm i @supabase/supabase-js @supabase/ssr
npm i @tanstack/react-query
npm i motion vaul
npm i react-hook-form @hookform/resolvers zod
npm i date-fns date-fns-tz
npm i lucide-react recharts

# PWA
npm i @serwist/next && npm i -D serwist

# Chaves VAPID
npx web-push generate-vapid-keys

# Supabase CLI
npm i -D supabase
npx supabase init
npx supabase link --project-ref <ref>
npx supabase db push

# Tipos a partir do schema
npx supabase gen types typescript --linked > types/database.ts
```

---

*Documento vivo — atualizar conforme as decisões da §14 forem tomadas.*
