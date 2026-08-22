-- Corrige lacuna de RLS na tabela audit_events.
--
-- A migração 0001 só criou uma policy de SELECT para audit_events. Com RLS
-- ativa, qualquer comando sem policy correspondente é negado por padrão —
-- então o insert feito em app/api/analisar/route.ts (via cliente autenticado
-- do próprio responsável, nunca service role) falhava silenciosamente em
-- toda análise. Resultado: a trilha de auditoria descrita no README nunca
-- era gravada, mesmo com o código "funcionando" sem lançar erro.

create policy "guardian registra seus próprios eventos de auditoria" on public.audit_events
  for insert with check (guardian_id = auth.uid());
