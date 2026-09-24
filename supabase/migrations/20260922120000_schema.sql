-- ═══════════════════════════════════════════════════════════
-- EXTENSÕES
-- ═══════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_cron";    -- agendamento (ver PLANO.md §8.6, Fase 4)
create extension if not exists "pg_net";     -- chamadas HTTP do banco (Fase 4)
create extension if not exists "unaccent";   -- busca sem acento
create extension if not exists "pg_trgm";    -- busca fuzzy por nome
create extension if not exists "btree_gist"; -- exclusion constraint da agenda


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
  restricoes_saude  text,
  alergias          text,
  preferencias      text,

  observacoes       text,
  tags              text[] not null default '{}',

  como_conheceu     text,

  arquivado_em      timestamptz,             -- soft delete — PLANO.md §5.1
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
  nome            text not null,
  descricao       text,
  duracao_min     int  not null,
  preco_centavos  bigint not null,           -- nunca float — PLANO.md §5.1
  cor             text not null default '#8B7CF6',
  ordem           int  not null default 0,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),

  constraint duracao_valida check (duracao_min > 0 and duracao_min <= 480),
  constraint preco_valido   check (preco_centavos >= 0)
);

create table servicos_historico_preco (
  id                  uuid primary key default gen_random_uuid(),
  servico_id          uuid not null references servicos(id) on delete cascade,
  preco_anterior      bigint not null,
  preco_novo          bigint not null,
  alterado_em         timestamptz not null default now()
);

create index idx_historico_preco_servico on servicos_historico_preco (servico_id, alterado_em desc);


-- ═══════════════════════════════════════════════════════════
-- PACOTES (montados sob medida para cada cliente — PLANO.md §6.4)
-- ═══════════════════════════════════════════════════════════
create table pacotes (
  id                   uuid primary key default gen_random_uuid(),
  cliente_id           uuid not null references clientes(id) on delete restrict,
  nome                 text not null,

  valor_bruto_centavos bigint not null,
  desconto_tipo        tipo_desconto not null default 'percentual',
  desconto_valor       numeric(10,2) not null default 0,
  valor_final_centavos bigint not null,

  validade             date,
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
  id                                    uuid primary key default gen_random_uuid(),
  pacote_id                             uuid not null references pacotes(id) on delete cascade,
  servico_id                            uuid not null references servicos(id) on delete restrict,

  quantidade                            int not null,
  quantidade_usada                      int not null default 0,

  -- Snapshots: preço no momento da venda + preço já com desconto rateado (PLANO.md §6.4, regra 1)
  preco_unitario_centavos               bigint not null,
  preco_unitario_com_desconto_centavos  bigint not null,

  constraint quantidade_valida check (quantidade > 0),
  constraint consumo_valido    check (quantidade_usada between 0 and quantidade)
);

create index idx_pacote_itens_pacote on pacote_itens (pacote_id);

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

  -- Snapshots no momento do agendamento — PLANO.md §5.1, regra 3
  preco_centavos     bigint not null,
  desconto_centavos  bigint not null default 0,
  valor_cobrado_centavos bigint generated always as
                     (preco_centavos - desconto_centavos) stored,

  observacoes        text,
  notas_sessao       text,

  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now(),

  constraint periodo_valido check (fim > inicio),
  constraint desconto_valido check (desconto_centavos between 0 and preco_centavos)
);

create index idx_agendamentos_periodo on agendamentos (inicio, fim);
create index idx_agendamentos_cliente on agendamentos (cliente_id, inicio desc);
create index idx_agendamentos_status  on agendamentos (status, inicio);

-- Impede dois atendimentos sobrepostos (exceto cancelados/faltas) — trava para o
-- caso de conflito descrito em PLANO.md §9.9-B
alter table agendamentos add constraint sem_sobreposicao
  exclude using gist (
    tstzrange(inicio, fim) with &&
  ) where (status in ('agendado', 'confirmado', 'concluido'));

create table bloqueios (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  inicio     timestamptz not null,
  fim        timestamptz not null,
  criado_em  timestamptz not null default now(),
  constraint periodo_valido check (fim > inicio)
);

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
  nome   text not null unique,
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

  dia_vencimento  int,     -- despesas fixas: dia do mês (1-31)
  data_despesa    date,    -- despesas ocasionais: data em que ocorreu

  ativa           boolean not null default true,
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
-- gerada automaticamente por um cron no dia 1º de cada mês (Fase 4).
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
  cliente_id      uuid references clientes(id) on delete set null,

  origem          text not null,             -- 'upload_txt' | 'api'
  nome_contato    text,
  telefone        text,

  arquivo_path    text,
  conteudo_bruto  text,
  total_mensagens int,
  periodo_inicio  timestamptz,
  periodo_fim     timestamptz,

  criado_em       timestamptz not null default now()
);

create table analises_ia (
  id                uuid primary key default gen_random_uuid(),
  conversa_id       uuid not null references conversas_whatsapp(id) on delete cascade,

  modelo            text not null,
  versao_prompt     text not null,
  resultado         jsonb,

  tokens_entrada    int,
  tokens_saida      int,
  tokens_cache_read int,
  custo_centavos_usd int,

  status            text not null default 'pendente',
  erro              text,

  iniciada_em       timestamptz not null default now(),
  concluida_em      timestamptz
);

-- Cada fato extraído vira uma sugestão que PRECISA de aprovação humana — PLANO.md §9.2
create table sugestoes_ia (
  id            uuid primary key default gen_random_uuid(),
  analise_id    uuid not null references analises_ia(id) on delete cascade,
  cliente_id    uuid references clientes(id) on delete cascade,

  tipo          text not null,               -- agendamento|pagamento|divida|pacote|observacao
  payload       jsonb not null,
  confianca     numeric(3,2) not null,
  evidencia     text not null,

  status        status_sugestao not null default 'pendente',
  aplicada_em   timestamptz,
  registro_id   uuid,

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

  tipo            text not null,
  titulo          text not null,
  corpo           text not null,
  url_destino     text,

  chave_unica     text unique,     -- idempotência: ex. 'lembrete:<agendamento_id>:1h'

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
