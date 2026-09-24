-- Geração automática das notificações — PLANO.md §8.5. Cada função abaixo só
-- ESCREVE em `notificacoes`; quem efetivamente envia é a Edge Function
-- enviar-push, disparada por um cron separado (ver README.md → "Notificações
-- push em produção", que usa a service_role_key — nunca comitada em migration).
--
-- pg_cron roda em UTC. BRT = UTC-3 (sem horário de verão atualmente).

create or replace function fn_formatar_reais(p_centavos bigint)
returns text
language sql
immutable
as $$
  select 'R$ ' || (p_centavos / 100) || ',' || lpad((abs(p_centavos) % 100)::text, 2, '0');
$$;

-- Preferências globais de notificação — uma profissional só por enquanto
-- (ver PLANO.md §13.3). Estrutura: {"<tipo>": {"ativo": true|false}, ...}
insert into configuracoes (chave, valor)
values ('notificacoes_prefs', '{}'::jsonb)
on conflict (chave) do nothing;

create or replace function fn_tipo_notificacao_ativo(p_tipo text)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select (valor -> p_tipo ->> 'ativo')::boolean
      from configuracoes
      where chave = 'notificacoes_prefs'
    ),
    true
  );
$$;


-- ═══════════════════════════════════════════════════════════
-- 1. Lembrete de atendimento — 1h antes
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_lembretes_agendamento()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
begin
  if not fn_tipo_notificacao_ativo('lembrete_agendamento') then return; end if;

  for v_user_id in select distinct user_id from push_subscriptions loop
    insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
    select
      v_user_id,
      'lembrete_agendamento',
      'Em 1h: ' || c.nome,
      s.nome || ' às ' || to_char(a.inicio at time zone 'America/Sao_Paulo', 'HH24:MI'),
      '/agenda',
      'lembrete:' || a.id || ':1h',
      now()
    from agendamentos a
    join clientes c on c.id = a.cliente_id
    join servicos s on s.id = a.servico_id
    where a.status in ('agendado', 'confirmado')
      and a.inicio between now() + interval '55 minutes' and now() + interval '65 minutes'
    on conflict (chave_unica) do nothing;
  end loop;
end;
$$;

select cron.schedule('lembretes-agendamento', '*/5 * * * *', 'select fn_gerar_lembretes_agendamento();');


-- ═══════════════════════════════════════════════════════════
-- 2. Resumo do dia — 07:00 BRT
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_resumo_diario()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not fn_tipo_notificacao_ativo('resumo_diario') then return; end if;

  for v_user_id in select distinct user_id from push_subscriptions loop
    insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
    select
      v_user_id,
      'resumo_diario',
      'Hoje: ' || count(*) || ' ' || case when count(*) = 1 then 'atendimento' else 'atendimentos' end,
      fn_formatar_reais(coalesce(sum(a.valor_cobrado_centavos), 0)) || ' previstos',
      '/agenda',
      'resumo_diario:' || v_hoje,
      now()
    from agendamentos a
    where a.status in ('agendado', 'confirmado')
      and (a.inicio at time zone 'America/Sao_Paulo')::date = v_hoje
    having count(*) > 0
    on conflict (chave_unica) do nothing;
  end loop;
end;
$$;

select cron.schedule('resumo-diario', '0 10 * * *', 'select fn_gerar_resumo_diario();');


-- ═══════════════════════════════════════════════════════════
-- 3. Cobrança pendente — 09:00 BRT, clientes devendo há mais de 15 dias
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_notificacao_cobranca_pendente()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
  v_qtd int;
  v_total bigint;
begin
  if not fn_tipo_notificacao_ativo('cobranca_pendente') then return; end if;

  select count(*), coalesce(sum(saldo_devedor), 0)
  into v_qtd, v_total
  from vw_saldo_cliente
  where saldo_devedor > 0
    and vencimento_mais_antigo < (current_date - 15);

  if v_qtd = 0 then return; end if;

  for v_user_id in select distinct user_id from push_subscriptions loop
    insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
    values (
      v_user_id,
      'cobranca_pendente',
      v_qtd || ' ' || case when v_qtd = 1 then 'cliente devendo' else 'clientes devendo' end || ' há mais de 15 dias',
      fn_formatar_reais(v_total),
      '/financeiro/inadimplentes',
      'cobranca_pendente:' || current_date::text,
      now()
    )
    on conflict (chave_unica) do nothing;
  end loop;
end;
$$;

select cron.schedule('cobranca-pendente', '0 12 * * *', 'select fn_gerar_notificacao_cobranca_pendente();');


-- ═══════════════════════════════════════════════════════════
-- 4. Despesa vencendo — 3 dias antes
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_notificacoes_despesa_vencendo()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
  v_ocorrencia record;
begin
  if not fn_tipo_notificacao_ativo('despesa_vencendo') then return; end if;

  for v_ocorrencia in
    select ocor.id, ocor.valor_centavos, d.descricao
    from despesas_ocorrencias ocor
    join despesas d on d.id = ocor.despesa_id
    where ocor.pago = false
      and ocor.vencimento = current_date + 3
  loop
    for v_user_id in select distinct user_id from push_subscriptions loop
      insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
      values (
        v_user_id,
        'despesa_vencendo',
        v_ocorrencia.descricao || ' vence em 3 dias',
        fn_formatar_reais(v_ocorrencia.valor_centavos),
        '/financeiro/despesas',
        'despesa_vencendo:' || v_ocorrencia.id,
        now()
      )
      on conflict (chave_unica) do nothing;
    end loop;
  end loop;
end;
$$;

select cron.schedule('despesa-vencendo', '0 11 * * *', 'select fn_gerar_notificacoes_despesa_vencendo();');


-- ═══════════════════════════════════════════════════════════
-- 5. Pacote expirando — 7 dias antes da validade
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_notificacoes_pacote_expirando()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
  v_pacote record;
begin
  if not fn_tipo_notificacao_ativo('pacote_expirando') then return; end if;

  for v_pacote in
    select p.id, p.cliente_id, c.nome as cliente_nome,
           coalesce(sum(pi.quantidade - pi.quantidade_usada), 0) as restantes
    from pacotes p
    join clientes c on c.id = p.cliente_id
    join pacote_itens pi on pi.pacote_id = p.id
    where p.status = 'ativo'
      and p.validade = current_date + 7
    group by p.id, p.cliente_id, c.nome
    having sum(pi.quantidade - pi.quantidade_usada) > 0
  loop
    for v_user_id in select distinct user_id from push_subscriptions loop
      insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
      values (
        v_user_id,
        'pacote_expirando',
        'Pacote de ' || v_pacote.cliente_nome || ' expira em 7 dias',
        v_pacote.restantes || ' sessões não usadas',
        '/clientes/' || v_pacote.cliente_id,
        'pacote_expirando:' || v_pacote.id,
        now()
      )
      on conflict (chave_unica) do nothing;
    end loop;
  end loop;
end;
$$;

select cron.schedule('pacote-expirando', '0 11 * * *', 'select fn_gerar_notificacoes_pacote_expirando();');


-- ═══════════════════════════════════════════════════════════
-- 6. Fechamento semanal — domingo 20:00 BRT
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_fechamento_semanal()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
  v_entradas bigint;
  v_saidas bigint;
  v_inicio_semana date := (now() at time zone 'America/Sao_Paulo')::date - 6;
begin
  if not fn_tipo_notificacao_ativo('fechamento_semanal') then return; end if;

  select coalesce(sum(valor_centavos), 0) into v_entradas
  from pagamentos
  where (pago_em at time zone 'America/Sao_Paulo')::date >= v_inicio_semana;

  select coalesce(sum(valor_centavos), 0) into v_saidas
  from despesas_ocorrencias
  where pago and pago_em is not null
    and (pago_em at time zone 'America/Sao_Paulo')::date >= v_inicio_semana;

  for v_user_id in select distinct user_id from push_subscriptions loop
    insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
    values (
      v_user_id,
      'fechamento_semanal',
      'Fechamento da semana',
      'Semana: ' || fn_formatar_reais(v_entradas) || ' entradas, ' || fn_formatar_reais(v_saidas) || ' saídas',
      '/financeiro',
      'fechamento_semanal:' || (now() at time zone 'America/Sao_Paulo')::date::text,
      now()
    )
    on conflict (chave_unica) do nothing;
  end loop;
end;
$$;

select cron.schedule('fechamento-semanal', '0 23 * * 0', 'select fn_gerar_fechamento_semanal();');


-- ═══════════════════════════════════════════════════════════
-- 7. Cliente inativa — 09:00 BRT, sem retorno há mais de 60 dias
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_notificacao_clientes_inativas()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
  v_qtd int;
begin
  if not fn_tipo_notificacao_ativo('cliente_inativa') then return; end if;

  select count(*) into v_qtd
  from clientes c
  where c.arquivado_em is null
    and exists (
      select 1 from agendamentos a where a.cliente_id = c.id and a.status = 'concluido'
    )
    and not exists (
      select 1 from agendamentos a
      where a.cliente_id = c.id
        and a.status = 'concluido'
        and a.inicio > now() - interval '60 days'
    );

  if v_qtd = 0 then return; end if;

  for v_user_id in select distinct user_id from push_subscriptions loop
    insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
    values (
      v_user_id,
      'cliente_inativa',
      v_qtd || ' ' || case when v_qtd = 1 then 'cliente sem retorno' else 'clientes sem retorno' end || ' há mais de 60 dias',
      'Toque para ver quem são',
      '/clientes?filtro=inativos',
      'cliente_inativa:' || current_date::text,
      now()
    )
    on conflict (chave_unica) do nothing;
  end loop;
end;
$$;

select cron.schedule('clientes-inativas', '0 12 * * *', 'select fn_gerar_notificacao_clientes_inativas();');


-- ═══════════════════════════════════════════════════════════
-- 8. Aniversário — 08:00 BRT
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_notificacoes_aniversario()
returns void
language plpgsql
as $$
declare
  v_user_id uuid;
  v_cliente record;
  v_hoje timestamptz := now() at time zone 'America/Sao_Paulo';
begin
  if not fn_tipo_notificacao_ativo('aniversario') then return; end if;

  for v_cliente in
    select id, nome
    from clientes
    where arquivado_em is null
      and data_nascimento is not null
      and extract(month from data_nascimento) = extract(month from v_hoje)
      and extract(day from data_nascimento) = extract(day from v_hoje)
  loop
    for v_user_id in select distinct user_id from push_subscriptions loop
      insert into notificacoes (user_id, tipo, titulo, corpo, url_destino, chave_unica, agendada_para)
      values (
        v_user_id,
        'aniversario',
        '🎂 Hoje é aniversário da ' || v_cliente.nome,
        'Que tal mandar uma mensagem?',
        '/clientes/' || v_cliente.id,
        'aniversario:' || v_cliente.id || ':' || v_hoje::date::text,
        now()
      )
      on conflict (chave_unica) do nothing;
    end loop;
  end loop;
end;
$$;

select cron.schedule('aniversarios', '0 11 * * *', 'select fn_gerar_notificacoes_aniversario();');
