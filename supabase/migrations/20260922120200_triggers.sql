-- ═══════════════════════════════════════════════════════════
-- trg_atualizado_em — mantém atualizado_em em dia (PLANO.md §5.5)
-- ═══════════════════════════════════════════════════════════
create or replace function fn_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger trg_atualizado_em before update on clientes
  for each row execute function fn_atualizado_em();
create trigger trg_atualizado_em before update on servicos
  for each row execute function fn_atualizado_em();
create trigger trg_atualizado_em before update on pacotes
  for each row execute function fn_atualizado_em();
create trigger trg_atualizado_em before update on agendamentos
  for each row execute function fn_atualizado_em();
create trigger trg_atualizado_em before update on cobrancas
  for each row execute function fn_atualizado_em();
create trigger trg_atualizado_em before update on despesas
  for each row execute function fn_atualizado_em();


-- ═══════════════════════════════════════════════════════════
-- trg_registrar_historico_preco — auditoria de troca de preço de serviço
-- ═══════════════════════════════════════════════════════════
create or replace function fn_registrar_historico_preco()
returns trigger
language plpgsql
as $$
begin
  if new.preco_centavos is distinct from old.preco_centavos then
    insert into servicos_historico_preco (servico_id, preco_anterior, preco_novo)
    values (old.id, old.preco_centavos, new.preco_centavos);
  end if;
  return new;
end;
$$;

create trigger trg_registrar_historico_preco
  after update on servicos
  for each row execute function fn_registrar_historico_preco();


-- ═══════════════════════════════════════════════════════════
-- trg_gerar_cobranca_agendamento — concluir sem pacote gera cobrança
-- ═══════════════════════════════════════════════════════════
create or replace function fn_gerar_cobranca_agendamento()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'concluido'
     and old.status is distinct from 'concluido'
     and new.pacote_item_id is null
     and new.valor_cobrado_centavos > 0 then
    insert into cobrancas (cliente_id, origem_tipo, agendamento_id, descricao, valor_centavos, status)
    values (
      new.cliente_id,
      'agendamento',
      new.id,
      'Atendimento em ' || to_char(new.inicio at time zone 'America/Sao_Paulo', 'DD/MM/YYYY'),
      new.valor_cobrado_centavos,
      'aberta'
    );
  end if;
  return new;
end;
$$;

create trigger trg_gerar_cobranca_agendamento
  after update on agendamentos
  for each row execute function fn_gerar_cobranca_agendamento();


-- ═══════════════════════════════════════════════════════════
-- trg_consumir_credito_pacote — concluir com pacote consome 1 crédito
-- ═══════════════════════════════════════════════════════════
create or replace function fn_consumir_credito_pacote()
returns trigger
language plpgsql
as $$
declare
  v_disponivel int;
begin
  if new.status = 'concluido'
     and old.status is distinct from 'concluido'
     and new.pacote_item_id is not null then

    select (quantidade - quantidade_usada) into v_disponivel
    from pacote_itens
    where id = new.pacote_item_id
    for update;

    if v_disponivel is null then
      raise exception 'Item de pacote % não encontrado', new.pacote_item_id;
    end if;

    if v_disponivel <= 0 then
      raise exception 'Sem créditos disponíveis nesse pacote para este serviço';
    end if;

    update pacote_itens
    set quantidade_usada = quantidade_usada + 1
    where id = new.pacote_item_id;
  end if;

  return new;
end;
$$;

create trigger trg_consumir_credito_pacote
  after update on agendamentos
  for each row execute function fn_consumir_credito_pacote();


-- ═══════════════════════════════════════════════════════════
-- trg_finalizar_pacote — todos os créditos consumidos → pacote concluído
-- ═══════════════════════════════════════════════════════════
create or replace function fn_finalizar_pacote()
returns trigger
language plpgsql
as $$
declare
  v_restantes int;
begin
  select coalesce(sum(quantidade - quantidade_usada), 0) into v_restantes
  from pacote_itens
  where pacote_id = new.pacote_id;

  if v_restantes = 0 then
    update pacotes
    set status = 'concluido'
    where id = new.pacote_id and status = 'ativo';
  end if;

  return new;
end;
$$;

create trigger trg_finalizar_pacote
  after update on pacote_itens
  for each row execute function fn_finalizar_pacote();


-- ═══════════════════════════════════════════════════════════
-- trg_atualizar_status_cobranca — pagamentos recalculam status da cobrança
-- ═══════════════════════════════════════════════════════════
create or replace function fn_atualizar_status_cobranca()
returns trigger
language plpgsql
as $$
declare
  v_cobranca_id     uuid;
  v_valor_cobranca  bigint;
  v_total_pago      bigint;
begin
  v_cobranca_id := coalesce(new.cobranca_id, old.cobranca_id);

  select valor_centavos into v_valor_cobranca
  from cobrancas where id = v_cobranca_id;

  select coalesce(sum(valor_centavos), 0) into v_total_pago
  from pagamentos where cobranca_id = v_cobranca_id;

  update cobrancas
  set status = case
    when v_total_pago <= 0 then 'aberta'::status_cobranca
    when v_total_pago >= v_valor_cobranca then 'paga'::status_cobranca
    else 'parcial'::status_cobranca
  end
  where id = v_cobranca_id
    and status <> 'cancelada';

  return coalesce(new, old);
end;
$$;

create trigger trg_atualizar_status_cobranca
  after insert or update or delete on pagamentos
  for each row execute function fn_atualizar_status_cobranca();


-- ═══════════════════════════════════════════════════════════
-- trg_auditoria — log de tratamento (LGPD — PLANO.md §10.4)
-- ═══════════════════════════════════════════════════════════
create or replace function fn_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into auditoria (tabela, registro_id, operacao, dados_antes, dados_depois, user_id)
  values (
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create trigger trg_auditoria after insert or update or delete on clientes
  for each row execute function fn_auditoria();
create trigger trg_auditoria after insert or update or delete on agendamentos
  for each row execute function fn_auditoria();
create trigger trg_auditoria after insert or update or delete on cobrancas
  for each row execute function fn_auditoria();
create trigger trg_auditoria after insert or update or delete on pagamentos
  for each row execute function fn_auditoria();
create trigger trg_auditoria after insert or update or delete on pacotes
  for each row execute function fn_auditoria();
create trigger trg_auditoria after insert or update or delete on despesas
  for each row execute function fn_auditoria();
