# Checklist de conclusão — protótipo v0

Levantamento feito em 22/08/2026, revisando o código contra o próprio recorte
que [`docs/LIMITACOES.md`](./LIMITACOES.md) já define como escopo desta versão
(a especificação comercial completa em `ESPECIFICACAO_ORIGINAL.md` não é o
alvo do v0 — isso já está documentado e não entra nesta lista).

## Corrigido

- **Faltava logout na interface.** Dava para entrar, mas não tinha como sair
  pela tela — só apagando cookies manualmente. Adicionado botão "Sair" no
  cabeçalho (`app/components/SairButton.tsx`).
- **Trilha de auditoria não era gravada.** A tabela `audit_events` só tinha
  policy de RLS para leitura (`SELECT`); o `insert` feito a cada análise
  (`app/api/analisar/route.ts`) era negado silenciosamente pelo Postgres, sem
  erro visível. Adicionada a policy de `INSERT` que faltava
  (`supabase/migrations/0002_audit_events_insert_policy.sql`) — **já aplicada
  no projeto Supabase em produção** (`kssuvgxwsixpercudybo`), confirmada
  contra `pg_policies` e com o advisor de segurança do Supabase limpo.
- **O projeto Supabase estava pausado (`INACTIVE`)** por inatividade no plano
  gratuito — **reativado**, agora `ACTIVE_HEALTHY`.
- **Testes automatizados do motor de políticas e do mascaramento.** Antes não
  havia nenhum teste no projeto. Adicionado `vitest` (`npm test`) com 20
  testes cobrindo `lib/policy/engine.ts` (contra a política real de produção,
  `v1-protecao-reforcada`) e `lib/sanitize/mask.ts` — as duas peças que
  garantem "nunca aprova sozinho".
  - Nesse processo, achei e corrigi um bug real: a regra "categoria CRITICO
    sempre escalona" (`aplicarMotorDePoliticas`) estava condicionada à flag
    `prevalencia_categoria_critica` da política, apesar do próprio comentário
    no código dizer que era uma regra dura "independente de qualquer
    configuração". Com a política atual (`prevalencia_categoria_critica:
    true`) isso nunca deu problema na prática, mas uma política futura com
    essa flag em `false` faria um sinal CRITICO cair pra "BLOQUEADO" em vez
    de "ESCALONAMENTO_PRIORITARIO" — ainda vai pra revisão, não aprova
    sozinho, mas perde a prioridade máxima. Corrigido para ser
    incondicional, com teste cobrindo o caso.
- **Editar/excluir perfil da criança.** Antes só dava pra cadastrar. Agora
  `app/perfil/page.tsx` tem botões "Editar" e "Excluir" em cada perfil.
- **`/login` não redirecionava quem já estava logado.** Corrigido no
  `middleware.ts`: usuário autenticado que acessa `/login` agora vai direto
  pro painel.
- **"Esqueci minha senha".** Fluxo completo adicionado:
  `/esqueci-senha` (pedir o link por e-mail, via
  `supabase.auth.resetPasswordForEmail`) e `/redefinir-senha` (definir a
  nova senha, via `supabase.auth.updateUser`). Link "Esqueci minha senha" na
  tela de login.

  ⚠️ **Ação pendente fora do código**: esse fluxo só funciona se o painel do
  Supabase (Authentication → URL Configuration) tiver a URL do app nas
  **Redirect URLs** permitidas — inclua algo como
  `https://SEU-DOMINIO/redefinir-senha` (e o preview da Vercel, se quiser
  testar por lá antes do domínio final). Sem isso, o Supabase rejeita ou
  ignora o `redirectTo` e o link do e-mail não leva a lugar nenhum.

## Fora de escopo de propósito (já documentado, não é pendência)

Tudo isto já está listado com clareza em `docs/LIMITACOES.md` e é uma
decisão consciente para a versão pessoal, não uma lacuna a fechar:
Hotmart/planos/cobrança, Modo Infantil (player curado), interceptação em
tempo real de YouTube/apps, PIN/passkey separado do login, canonicalização
de ID de vídeo/canal, moderação de comentários, denúncia automática.

## Verificado nesta passada

- `npm run typecheck`, `npm test` (20 testes) e `npm run build` passam limpos.
- RLS revisada tabela a tabela contra `0001_schema_inicial_v0.sql`: todas as
  outras tabelas (`guardians`, `child_profiles`, `content_submissions`,
  `analyses`, `risk_findings`, `trusted_content_rules`) já tinham policy de
  `INSERT`/`UPDATE` cobrindo o que o código realmente usa — só `audit_events`
  tinha o buraco corrigido acima.
- Advisor de segurança do Supabase (`get_advisors`) sem alertas após as
  mudanças de RLS.

## O que ainda não existe (consciente, não é urgente)

- Painel administrativo, quotas/planos, PIN parental separado, WebAuthn —
  tudo isso é da especificação comercial completa, fora do recorte pessoal
  (ver `docs/LIMITACOES.md`).
- O projeto Vercel antigo/duplicado (`guardiao-de-conteudo`, distinto de
  `guardiao-de-conteudo-app`) ainda está conectado ao repositório e continua
  falhando build a cada push — remover/desconectar esse projeto no painel da
  Vercel é uma ação manual, fora do meu acesso.
