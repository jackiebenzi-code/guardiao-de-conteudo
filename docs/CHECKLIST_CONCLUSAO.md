# Checklist de conclusão — protótipo v0

Levantamento feito em 22/08/2026, revisando o código contra o próprio recorte
que [`docs/LIMITACOES.md`](./LIMITACOES.md) já define como escopo desta versão
(a especificação comercial completa em `ESPECIFICACAO_ORIGINAL.md` não é o
alvo do v0 — isso já está documentado e não entra nesta lista).

## ⚠️ Ação urgente, fora do código

- **O projeto Supabase (`guardiao-de-conteudo`, `kssuvgxwsixpercudybo`) está
  pausado (`INACTIVE`)** — provavelmente por inatividade no plano gratuito.
  Enquanto estiver pausado, login, cadastro de perfil e análise não
  funcionam (a chamada ao banco falha). É preciso reativar o projeto no
  painel do Supabase (ou eu reativo, se você confirmar) antes de usar o app.

## Corrigido nesta passada

- **Faltava logout na interface.** Dava para entrar, mas não tinha como sair
  pela tela — só apagando cookies manualmente. Adicionado botão "Sair" no
  cabeçalho (`app/components/SairButton.tsx`).
- **Trilha de auditoria não era gravada.** A tabela `audit_events` só tinha
  policy de RLS para leitura (`SELECT`); o `insert` feito a cada análise
  (`app/api/analisar/route.ts`) era negado silenciosamente pelo Postgres, sem
  erro visível. Adicionada a policy de `INSERT` que faltava
  (`supabase/migrations/0002_audit_events_insert_policy.sql`). **Precisa
  aplicar essa migração no projeto Supabase** (assim que ele for reativado)
  para o efeito valer em produção — no dashboard, em SQL Editor, ou via
  `supabase db push` se você usar a CLI localmente.

## Ainda falta (pequeno, não bloqueia uso)

- **Editar/excluir perfil da criança.** Hoje só dá para cadastrar; não tem
  como corrigir apelido/faixa etária ou remover um perfil pela tela.
- **"Esqueci minha senha".** Não tem fluxo de recuperação — para uso de uma
  pessoa só isso é tolerável, mas é um ponto cego se a senha for perdida.
- **`/login` não redireciona quem já está logado.** Sem problema funcional,
  só uma tela desnecessária se a pessoa acessar `/login` já autenticada.
- **Nenhum teste automatizado.** A especificação original pede suíte
  completa (RLS, schema da IA, fallback, prompt injection etc.); o recorte
  pessoal não exige isso, mas vale pelo menos alguns testes do motor de
  políticas (`lib/policy/engine.ts`) e do mascaramento
  (`lib/sanitize/mask.ts`), que são as duas peças que garantem "nunca aprova
  sozinho" — são puras e fáceis de testar sem infraestrutura.

## Fora de escopo de propósito (já documentado, não é pendência)

Tudo isto já está listado com clareza em `docs/LIMITACOES.md` e é uma
decisão consciente para a versão pessoal, não uma lacuna a fechar:
Hotmart/planos/cobrança, Modo Infantil (player curado), interceptação em
tempo real de YouTube/apps, PIN/passkey separado do login, canonicalização
de ID de vídeo/canal, moderação de comentários, denúncia automática.

## Verificado nesta passada

- `npm run typecheck` e `npm run build` passam limpos.
- RLS revisada tabela a tabela contra `0001_schema_inicial_v0.sql`: todas as
  outras tabelas (`guardians`, `child_profiles`, `content_submissions`,
  `analyses`, `risk_findings`, `trusted_content_rules`) já tinham policy de
  `INSERT`/`UPDATE` cobrindo o que o código realmente usa — só `audit_events`
  tinha o buraco acima.
