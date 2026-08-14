import { createClient } from "@/lib/supabase/server";
import { DECISAO_INFO } from "@/lib/ui/decisao";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: analises } = await supabase
    .from("analyses")
    .select("id, decision, summary_for_parent, requires_human_review, created_at, content_submissions(titulo, tipo)")
    .order("created_at", { ascending: false })
    .limit(20);

  const pendentes = (analises ?? []).filter((a) => a.requires_human_review);

  return (
    <div className="container-app max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Painel</h1>
        <a href="/analisar" className="btn-primary">
          Analisar conteúdo
        </a>
      </div>

      {pendentes.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Precisa da sua revisão ({pendentes.length})
          </h2>
          <ul className="space-y-2">
            {pendentes.map((a) => (
              <LinhaAnalise key={a.id} analise={a} />
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Histórico recente
        </h2>
        {!analises || analises.length === 0 ? (
          <p className="card text-sm text-neutral-500">
            Nenhuma análise ainda.{" "}
            <a href="/analisar" className="underline">
              Analisar o primeiro conteúdo
            </a>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {analises.map((a) => (
              <LinhaAnalise key={a.id} analise={a} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LinhaAnalise({
  analise,
}: {
  analise: {
    id: string;
    decision: string;
    summary_for_parent: string;
    created_at: string;
    content_submissions: unknown;
  };
}) {
  const info = DECISAO_INFO[analise.decision] ?? { rotulo: analise.decision, cor: "", explicacao: "" };
  const submissao = Array.isArray(analise.content_submissions)
    ? analise.content_submissions[0]
    : analise.content_submissions;
  const titulo = (submissao as { titulo?: string } | null)?.titulo;

  return (
    <li>
      <a href={`/analises/${analise.id}`} className="card block hover:border-neutral-400">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{titulo || "Conteúdo sem título"}</p>
          <span className={`text-xs font-semibold ${info.cor}`}>{info.rotulo}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{analise.summary_for_parent}</p>
      </a>
    </li>
  );
}
