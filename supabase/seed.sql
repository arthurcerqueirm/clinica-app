-- Aplicado depois das migrations em `supabase db reset` (dev local).
-- Em produção, rode este arquivo manualmente uma vez após o primeiro `db push`.

insert into categorias_despesa (nome, cor) values
  ('Aluguel',            '#B54A4A'),
  ('Produtos e insumos', '#C89F7B'),
  ('Equipamentos',       '#78716C'),
  ('Marketing',          '#7C6A9E'),
  ('Impostos',           '#C9853F'),
  ('Transporte',         '#4A7C59'),
  ('Educação',           '#5B8DB8'),
  ('Software',           '#8B7CF6'),
  ('Manutenção',         '#94A3B8'),
  ('Outros',             '#A8A29E')
on conflict (nome) do nothing;

-- Horário de funcionamento padrão: seg-sex 9h-18h, sáb 9h-13h. Ajustável em Ajustes (Fase 1).
insert into horarios_atendimento (dia_semana, hora_inicio, hora_fim) values
  (1, '09:00', '18:00'),
  (2, '09:00', '18:00'),
  (3, '09:00', '18:00'),
  (4, '09:00', '18:00'),
  (5, '09:00', '18:00'),
  (6, '09:00', '13:00');

-- Modelo de mensagem de cobrança padrão (editável em Ajustes → Cobrança — Fase 2)
insert into configuracoes (chave, valor) values
  ('mensagem_cobranca', '{"texto": "Oi {nome}, tudo bem? 😊 Passando para lembrar do valor de {valor} referente aos nossos últimos atendimentos. Pode pagar no PIX {chave_pix}. Qualquer dúvida me chama!"}'),
  ('chave_pix', '{"valor": ""}')
on conflict (chave) do nothing;
