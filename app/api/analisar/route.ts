import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mascararDadosPessoais, LIMITE_CARACTERES_ENTRADA } from "@/lib/sanitize/mask";
import { analisarComModelo } from "@/lib/ai/analyze";
import { aplicarMotorDePoliticas, resultadoFallback, type RegrasPolitica } from "@/lib/policy/engine";

export const runtime = "nodejs";

interface CorpoRequisicao {
  tipo: "url" | "texto" | "descricao";
  titulo?: string;
  conteudo: string;
  child_profile_id?: string | null;
  faixa_etaria_min?: number;
  faixa_etaria_max?: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let corpo: CorpoRequisicao;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!corpo.conteudo || typeof corpo.conteudo !== "string" || !corpo.conteudo.trim()) {
    return NextResponse.json({ erro: "Conteúdo vazio." }, { status: 400 });
  }
  if (!["url", "texto", "descricao"].includes(corpo.tipo)) {
    return NextResponse.json({ erro: "Tipo inválido." }, { status: 400 });
  }
  if (corpo.conteudo.length > LIMITE_CARACTERES_ENTRADA) {
    return NextResponse.json(
      { erro: `Conteúdo excede o limite de ${LIMITE_CARACTERES_ENTRADA} caracteres.` },
      { status: 400 }
    );
  }

  const faixaMin = corpo.faixa_etaria_min ?? 7;
  const faixaMax = corpo.faixa_etaria_max ?? 12;

  const { higienizado, ocorrencias } = mascararDadosPessoais(corpo.conteudo);

  // 1. Busca a política ativa mais recente.
  const { data: politica, error: erroPolitica } = await supabase
    .from("policy_versions")
    .select("id, versao, regras")
    .order("ativo_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroPolitica || !politica) {
    return NextResponse.json({ erro: "Nenhuma política ativa encontrada." }, { status: 500 });
  }

  // 2. Registra a submissão.
  const { data: submissao, error: erroSubmissao } = await supabase
    .from("content_submissions")
    .insert({
      guardian_id: user.id,
      child_profile_id: corpo.child_profile_id ?? null,
      tipo: corpo.tipo,
      titulo: corpo.titulo?.slice(0, 300) ?? null,
      conteudo_higienizado: higienizado,
      url_original: corpo.tipo === "url" ? corpo.conteudo.slice(0, 2000) : null,
      status: "queued",
    })
    .select("id")
    .single();

  if (erroSubmissao || !submissao) {
    return NextResponse.json({ erro: "Falha ao registrar submissão." }, { status: 500 });
  }

  // 3. Chama o modelo; qualquer falha vira fallback conservador (nunca aprovação).
  const chamada = await analisarComModelo({
    conteudoHigienizado: higienizado,
    tipo: corpo.tipo,
    titulo: corpo.titulo,
    faixaEtariaMin: faixaMin,
    faixaEtariaMax: faixaMax,
  });

  const resultado = chamada.ok
    ? aplicarMotorDePoliticas(chamada.dados, politica.regras as RegrasPolitica, chamada.modelVersion, politica.versao)
    : resultadoFallback(chamada.motivo, politica.versao);

  if (ocorrencias > 0) {
    resultado.limitations = [
      ...resultado.limitations,
      `${ocorrencias} possível(is) dado(s) pessoal(is) foram mascarados antes da análise.`,
    ];
  }

  // 4. Persiste a análise.
  const { data: analise, error: erroAnalise } = await supabase
    .from("analyses")
    .insert({
      guardian_id: user.id,
      submission_id: submissao.id,
      decision: resultado.decision,
      summary_for_parent: resultado.summary_for_parent,
      age_range_min: resultado.age_range_evaluated.minimum,
      age_range_max: resultado.age_range_evaluated.maximum,
      protective_factors: resultado.protective_factors,
      limitations: resultado.limitations,
      requires_human_review: resultado.requires_human_review,
      model_version: resultado.model_version,
      policy_version_id: politica.id,
      prompt_version: resultado.prompt_version,
    })
    .select("id")
    .single();

  if (erroAnalise || !analise) {
    await supabase.from("content_submissions").update({ status: "erro" }).eq("id", submissao.id);
    return NextResponse.json({ erro: "Falha ao registrar análise." }, { status: 500 });
  }

  if (resultado.risk_categories.length > 0) {
    await supabase.from("risk_findings").insert(
      resultado.risk_categories.map((achado) => ({
        analysis_id: analise.id,
        category: achado.category,
        level: achado.level,
        confidence: achado.confidence,
        evidence: achado.evidence,
        missing_context: achado.missing_context,
        recommended_action: achado.recommended_action,
      }))
    );
  }

  await supabase.from("content_submissions").update({ status: "analisado" }).eq("id", submissao.id);

  await supabase.from("audit_events").insert({
    guardian_id: user.id,
    ator: user.id,
    acao: "analise_criada",
    alvo: analise.id,
    metadados: { decision: resultado.decision, tipo: corpo.tipo },
  });

  return NextResponse.json({ analysisId: analise.id, decision: resultado.decision });
}
