-- Row Level Security — PLANO.md §10.2.
-- Uma profissional só (por enquanto): toda pessoa autenticada tem acesso total
-- às tabelas operacionais. Quando houver múltiplas profissionais (§13.3),
-- trocar `using (true)` por um filtro de papel/usuário.

do $$
declare
  t text;
  tabelas_acesso_total text[] := array[
    'clientes', 'servicos', 'servicos_historico_preco',
    'pacotes', 'pacote_itens', 'pacote_modelos',
    'agendamentos', 'bloqueios', 'horarios_atendimento',
    'cobrancas', 'pagamentos',
    'categorias_despesa', 'despesas', 'despesas_ocorrencias',
    'conversas_whatsapp', 'analises_ia', 'sugestoes_ia',
    'configuracoes'
  ];
begin
  foreach t in array tabelas_acesso_total loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy "usuarios autenticados acessam %1$s" on %1$I
         for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- push_subscriptions e notificacoes: escopo por usuário, não acesso total —
-- cada dispositivo/pessoa só vê a própria inscrição/notificação.
alter table push_subscriptions enable row level security;

create policy "usuario acessa as proprias subscriptions"
  on push_subscriptions for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table notificacoes enable row level security;

create policy "usuario acessa as proprias notificacoes"
  on notificacoes for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- auditoria: só leitura pelo app — quem escreve é o trigger (security definer),
-- que ignora RLS.
alter table auditoria enable row level security;

create policy "usuarios autenticados leem auditoria"
  on auditoria for select
  to authenticated
  using (true);
