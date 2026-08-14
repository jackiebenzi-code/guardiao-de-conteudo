import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS_RISCO } from "@/lib/ai/schema";
import { DECISAO_INFO, NIVEL_COR } from "@/lib/ui/decisao";
import AdicionarConfianca from "./AdicionarConfianca";

function rotuloCategoria(slug: string) {
  return CATEGORIAS_RISCO.find((c) => c.slug === slug)?.rotulo ?? slug;
}

export default async function AnaliseDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: analise } = await supabase
    .from("analyses")
    .select(
      "id, decision, summary_for_parent, age_range_min, age_range_max, protective_factors, limitations, requires_human_review, model_version, prompt_version, created_at, submission_id, content_submissions(id, tipo, titulo, url_original, child_profile_id)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!analise) notFound();

  const { data: achados } = await supabase
    .from("risk_findings")
    .select("category, level, confidence, evidence, missing_context, recommended_action")
    .eq("analysis_id", id)
    .order("level", { ascending: false });

  const info = DECISAO_INFO[analise.decision] ?? {
    rotulo: analise.decision,
    cor: "",
    explicacao: "",
  };

  const submissao = Array.isArray(analise.content_submissions)
    ? analise.content_submissions[0]
    : analise.content_submissions;

  const podeAdicionarConfianca =
    submissao && (analise.decision === "APROVADO" || analise.decision === "APROVADO_COM_ORIENTACAO");

  return (
    <div className="container-app max-w-2xl space-y-6">
      <div>
        <p className={`text-sm font-semibold uppercase tracking-wide ${info.cor}`}>{info.rotulo}</p>
        <h1 className="mt-1 text-xl font-semibold">{submissao?.titulo || "Conteúdo analisado"}</h1>
        <p className="mt-1 text-sm text-neutral-500">{info.explicacao}</p>
      </div>

      <div className="card">
        <h2 className="mb-2 font-medium">Resumo</h2>
        <p className="text-sm text-neutral-700">{analise.summary_for_parent}</p>
        <p className="mt-3 text-xs text-neutral-400">
          Faixa etária avaliada: {analise.age_range_min}–{analise.age_range_max} anos · modelo{" "}
          {analise.model_version} · política/prompt registrados para auditoria
        </p>
      </div>

      {achados && achados.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-medium">Categorias analisadas</h2>
          <div className="space-y-3">
            {achados
              .filter((a) => a.level !== "NENHUM")
              .map((a) => (
                <div key={a.category} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{rotuloCategoria(a.category)}</p>
                    <span className={`text-xs font-semibold ${NIVEL_COR[a.level] ?? ""}`}>
                      {a.level} · confiança {a.confidence.toLowerCase()}
                    </span>
                  </div>
                  {a.evidence?.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-xs text-neutral-500">
                      {a.evidence.map((ev: string, i: number) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  )}
                  {a.recommended_action && (
                    <p className="mt-1 text-xs text-neutral-600">Ação recomendada: {a.recommended_action}</p>
                  )}
                </div>
              ))}
            {achados.every((a) => a.level === "NENHUM") && (
              <p className="text-sm text-neutral-500">Nenhuma categoria com sinal relevante.</p>
            )}
          </div>
        </div>
      )}

      {analise.protective_factors?.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-medium">Fatores de proteção observados</h2>
          <ul className="list-disc pl-5 text-sm text-neutral-700">
            {analise.protective_factors.map((f: string, i: number) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {analise.limitations?.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-medium">Limitações desta análise</h2>
          <ul className="list-disc pl-5 text-sm text-neutral-700">
            {analise.limitations.map((l: string, i: number) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      {podeAdicionarConfianca && submissao && (
        <div className="card">
          <AdicionarConfianca
            childProfileId={submissao.child_profile_id}
            tipoItem={submissao.tipo}
            identificadorCanonico={submissao.url_original || submissao.titulo || submissao.id}
            titulo={submissao.titulo}
          />
        </div>
      )}
    </div>
  );
}
