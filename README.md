# Guardião de Conteúdo — protótipo pessoal

Protótipo pessoal (não comercial) de análise de conteúdo digital, para apoiar decisões
de proteção. Recorte enxuto da especificação original, priorizado para uso real por
uma família, não para venda.

Antes de mexer no código, leia [`docs/LIMITACOES.md`](./docs/LIMITACOES.md) — explica
com clareza o que isto faz e, principalmente, o que **não** faz.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
# edite .env.local e cole sua OPENAI_API_KEY
npm run dev
```

Abre em `http://localhost:3000`. Crie uma conta (é só sua, não é multi-usuário nessa
versão), cadastre o perfil da criança em **Perfil da criança**, e já pode usar
**Analisar conteúdo**.

## Infraestrutura já provisionada

- **Supabase** — projeto `guardiao-de-conteudo` (região `sa-east-1`, isolado de
  qualquer outro projeto), schema em [`supabase/migrations/0001_schema_inicial_v0.sql`](./supabase/migrations/0001_schema_inicial_v0.sql).
  RLS ativa em todas as tabelas.
- **IA** — OpenAI, chamada só a partir do servidor (`lib/ai/analyze.ts`), com saída
  estruturada validada por schema (`lib/ai/schema.ts`) e fallback conservador em
  qualquer falha (`lib/policy/engine.ts`).

## Estrutura

```
app/
  analisar/          formulário de submissão
  analises/[id]/      resultado detalhado de uma análise
  confianca/          Lista de Confiança (itens já aprovados)
  perfil/              cadastro do perfil da criança
  api/analisar/        rota que orquestra: mascarar → IA → motor de políticas → salvar
lib/
  ai/                  chamada ao modelo + schema de validação
  policy/              motor de políticas determinístico
  sanitize/             mascaramento de dados pessoais
  supabase/             clientes Supabase (browser e servidor)
```