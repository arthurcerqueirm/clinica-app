-- Saldo devedor por cliente (base da tela de inadimplentes — PLANO.md §6.6)
-- security_invoker: a view roda com as permissões de quem consulta, não de quem
-- criou — senão ela ignora a RLS das tabelas por baixo (clientes, cobrancas...).
create view vw_saldo_cliente
with (security_invoker = true)
as
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


-- Fluxo de caixa mensal (receitas realizadas x despesas pagas — PLANO.md §6.5)
create view vw_fluxo_caixa_mensal
with (security_invoker = true)
as
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


-- Créditos de pacote ainda disponíveis (PLANO.md §6.4)
create view vw_creditos_pacote
with (security_invoker = true)
as
select
  p.id            as pacote_id,
  p.cliente_id,
  c.nome          as cliente_nome,
  s.id            as servico_id,
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
