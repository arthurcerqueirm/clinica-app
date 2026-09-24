-- Expira pacotes vencidos automaticamente, todo dia às 06:00 BRT (09:00 UTC) —
-- PLANO.md §6.4 regra 5. Autocontido (só SQL), diferente dos crons de notificação
-- que dependem da Edge Function de push (Fase 4).
select cron.schedule(
  'expirar-pacotes',
  '0 9 * * *',
  $$
  update pacotes
  set status = 'expirado'
  where status = 'ativo'
    and validade is not null
    and validade < current_date;
  $$
);
