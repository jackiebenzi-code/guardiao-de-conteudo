-- Guardião de Conteúdo — schema mínimo v0 (uso pessoal, não comercial)
-- Espelha exatamente a migração aplicada ao projeto Supabase "guardiao-de-conteudo"
-- (região sa-east-1), para o schema ficar versionado junto do código.
-- Isolamento por guardian_id (RLS) mesmo em uso unifamiliar, para já nascer seguro.

create table if not exists public.guardians (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  apelido text not null,
  faixa_etaria_min int not null default 7,
  faixa_etaria_max int not null default 12,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  versao text not null,
  regras jsonb not null,
  changelog text,
  ativo_desde timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete set null,
  tipo text not null check (tipo in ('url', 'texto', 'descricao')),
  titulo text,
  conteudo_higienizado text not null,
  url_original text,
  identificador_canonico text,
  status text not null default 'queued' check (status in ('queued', 'analisado', 'erro')),
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  submission_id uuid not null references public.content_submissions(id) on delete cascade,
  decision text not null check (decision in ('APROVADO', 'APROVADO_COM_ORIENTACAO', 'REVISAO', 'BLOQUEADO', 'ESCALONAMENTO_PRIORITARIO')),
  summary_for_parent text not null,
  age_range_min int,
  age_range_max int,
  protective_factors jsonb not null default '[]',
  limitations jsonb not null default '[]',
  requires_human_review boolean not null default false,
  model_version text,
  policy_version_id uuid references public.policy_versions(id),
  prompt_version text,
  raw_model_output jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_findings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  category text not null,
  level text not null check (level in ('NENHUM', 'BAIXO', 'MODERADO', 'ALTO', 'CRITICO')),
  confidence text not null check (confidence in ('BAIXA', 'MEDIA', 'ALTA')),
  evidence jsonb not null default '[]',
  missing_context jsonb not null default '[]',
  recommended_action text,
  created_at timestamptz not null default now()
);

create table if not exists public.trusted_content_rules (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete set null,
  tipo_item text not null,
  identificador_canonico text not null,
  titulo text,
  tipo_autorizacao text not null check (tipo_autorizacao in ('UNICA', 'TEMPORARIA', 'SERIE', 'CANAL', 'PERMANENTE', 'BLOQUEIO_PERMANENTE')),
  continuar_analisando boolean not null default true,
  validade timestamptz,
  justificativa text,
  criado_em timestamptz not null default now(),
  revogado_em timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  ator text not null,
  acao text not null,
  alvo text,
  metadados jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_child_profiles_guardian on public.child_profiles(guardian_id);
create index if not exists idx_submissions_guardian on public.content_submissions(guardian_id);
create index if not exists idx_submissions_status on public.content_submissions(status);
create index if not exists idx_analyses_guardian on public.analyses(guardian_id);
create index if not exists idx_analyses_submission on public.analyses(submission_id);
create index if not exists idx_risk_findings_analysis on public.risk_findings(analysis_id, category);
create index if not exists idx_trusted_guardian_id on public.trusted_content_rules(guardian_id, identificador_canonico);
create index if not exists idx_audit_guardian_created on public.audit_events(guardian_id, created_at);

alter table public.guardians enable row level security;
alter table public.child_profiles enable row level security;
alter table public.policy_versions enable row level security;
alter table public.content_submissions enable row level security;
alter table public.analyses enable row level security;
alter table public.risk_findings enable row level security;
alter table public.trusted_content_rules enable row level security;
alter table public.audit_events enable row level security;

create policy "guardian vê e edita o próprio registro" on public.guardians
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "guardian gerencia seus perfis infantis" on public.child_profiles
  for all using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());

create policy "policy_versions são de leitura autenticada" on public.policy_versions
  for select using (auth.role() = 'authenticated');

create policy "guardian gerencia suas submissões" on public.content_submissions
  for all using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());

create policy "guardian gerencia suas análises" on public.analyses
  for all using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());

create policy "guardian vê achados das próprias análises" on public.risk_findings
  for all using (
    exists (select 1 from public.analyses a where a.id = risk_findings.analysis_id and a.guardian_id = auth.uid())
  ) with check (
    exists (select 1 from public.analyses a where a.id = risk_findings.analysis_id and a.guardian_id = auth.uid())
  );

create policy "guardian gerencia sua lista de confiança" on public.trusted_content_rules
  for all using (guardian_id = auth.uid()) with check (guardian_id = auth.uid());

create policy "guardian vê seus próprios eventos de auditoria" on public.audit_events
  for select using (guardian_id = auth.uid());

insert into public.policy_versions (versao, changelog, regras)
values (
  'v1-protecao-reforcada',
  'Política inicial do protótipo pessoal. Thresholds reduzidos para violência/ameaça (categoria 4) e conteúdo assustador/inadequado (categoria 14): MODERADO já bloqueia, em vez de apenas revisar.',
  '{
    "prevalencia_categoria_critica": true,
    "fallback_em_falha": "REVISAO",
    "thresholds_padrao": {"bloqueia_a_partir_de": "ALTO", "revisa_a_partir_de": "MODERADO"},
    "overrides_categoria": {
      "violencia_ou_ameaca": {"bloqueia_a_partir_de": "MODERADO"},
      "incentivo_comportamento_perigoso": {"bloqueia_a_partir_de": "MODERADO"},
      "conteudo_assustador_inadequado_idade": {"bloqueia_a_partir_de": "MODERADO"},
      "autolesao": {"bloqueia_a_partir_de": "BAIXO", "escalonamento_a_partir_de": "MODERADO"}
    },
    "confianca_baixa_reduz_para": "REVISAO"
  }'::jsonb
);
