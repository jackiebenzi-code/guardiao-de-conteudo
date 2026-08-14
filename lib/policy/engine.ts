import type { AnaliseModelo, CategoriaSlug, ResultadoAnalise } from "../ai/schema";
import { PROMPT_VERSION } from "../ai/analyze";

const NIVEL_ORDEM = { NENHUM: 0, BAIXO: 1, MODERADO: 2, ALTO: 3, CRITICO: 4 } as const;
type Nivel = keyof typeof NIVEL_ORDEM;

interface OverrideCategoria {
  bloqueia_a_partir_de?: Nivel;
  escalonamento_a_partir_de?: Nivel;
}

export interface RegrasPolitica {
  prevalencia_categoria_critica: boolean;
  fallback_em_falha: "REVISAO";
  thresholds_padrao: { bloqueia_a_partir_de: Nivel; revisa_a_partir_de: Nivel };
  overrides_categoria: Partial<Record<CategoriaSlug, OverrideCategoria>>;
  confianca_baixa_reduz_para: "REVISAO";
}

const RANK: Record<ResultadoAnalise["decision"], number> = {
  APROVADO: 0,
  APROVADO_COM_ORIENTACAO: 1,
  REVISAO: 2,
  BLOQUEADO: 3,
  ESCALONAMENTO_PRIORITARIO: 4,
};

function maisSevera(
  a: ResultadoAnalise["decision"],
  b: ResultadoAnalise["decision"]
): ResultadoAnalise["decision"] {
  return RANK[a] >= RANK[b] ? a : b;
}

/**
 * Motor de políticas determinístico (Especificação, Seção 15).
 * O modelo produz sinais; ESTA função — não o prompt — decide o estado final.
 * Regra dura, sempre ativa independente da política carregada: qualquer
 * categoria CRITICO vira ESCALONAMENTO_PRIORITARIO.
 */
export function aplicarMotorDePoliticas(
  saidaModelo: AnaliseModelo,
  regras: RegrasPolitica,
  modelVersion: string,
  policyVersion: string
): ResultadoAnalise {
  let decisaoFinal: ResultadoAnalise["decision"] = "APROVADO";
  let algumBaixo = false;

  for (const achado of saidaModelo.risk_categories) {
    const nivel = NIVEL_ORDEM[achado.level as Nivel];
    const override = regras.overrides_categoria[achado.category];
    const thresholdBloqueio = override?.bloqueia_a_partir_de ?? regras.thresholds_padrao.bloqueia_a_partir_de;
    const thresholdRevisao = regras.thresholds_padrao.revisa_a_partir_de;
    const thresholdEscalonamento = override?.escalonamento_a_partir_de;

    // Regra dura: nível CRITICO em qualquer categoria sempre escalona,
    // independente de qualquer configuração de política.
    if (achado.level === "CRITICO" && regras.prevalencia_categoria_critica) {
      decisaoFinal = maisSevera(decisaoFinal, "ESCALONAMENTO_PRIORITARIO");
      continue;
    }

    if (thresholdEscalonamento && nivel >= NIVEL_ORDEM[thresholdEscalonamento]) {
      decisaoFinal = maisSevera(decisaoFinal, "ESCALONAMENTO_PRIORITARIO");
      continue;
    }

    if (nivel >= NIVEL_ORDEM[thresholdBloqueio]) {
      // Confiança baixa não autoriza uma decisão assertiva de bloqueio —
      // vira revisão, para o responsável decidir com o contexto que falta.
      if (achado.confidence === "BAIXA") {
        decisaoFinal = maisSevera(decisaoFinal, "REVISAO");
      } else {
        decisaoFinal = maisSevera(decisaoFinal, "BLOQUEADO");
      }
      continue;
    }

    if (nivel >= NIVEL_ORDEM[thresholdRevisao]) {
      decisaoFinal = maisSevera(decisaoFinal, "REVISAO");
      continue;
    }

    if (achado.level === "BAIXO") {
      algumBaixo = true;
    }
  }

  if (decisaoFinal === "APROVADO" && algumBaixo) {
    decisaoFinal = "APROVADO_COM_ORIENTACAO";
  }

  return {
    decision: decisaoFinal,
    summary_for_parent: saidaModelo.summary_for_parent,
    age_range_evaluated: saidaModelo.age_range_evaluated,
    risk_categories: saidaModelo.risk_categories,
    protective_factors: saidaModelo.protective_factors,
    limitations: saidaModelo.limitations,
    requires_human_review: decisaoFinal !== "APROVADO",
    immediate_parent_actions: saidaModelo.immediate_parent_actions,
    model_version: modelVersion,
    policy_version: policyVersion,
    prompt_version: PROMPT_VERSION,
  };
}

/**
 * Resultado de fallback conservador — usado sempre que o modelo falha,
 * demora demais ou devolve algo fora do schema. NUNCA aprova automaticamente
 * (Especificação, princípio "Fallback conservador").
 */
export function resultadoFallback(motivo: string, policyVersion: string): ResultadoAnalise {
  return {
    decision: "REVISAO",
    summary_for_parent:
      "Não foi possível concluir a análise automática deste conteúdo. Por segurança, ele foi enviado para sua revisão manual.",
    age_range_evaluated: { minimum: 7, maximum: 12 },
    risk_categories: [],
    protective_factors: [],
    limitations: [`Falha técnica na análise: ${motivo}`],
    requires_human_review: true,
    immediate_parent_actions: ["Revisar este conteúdo manualmente antes de autorizar."],
    model_version: "indisponivel",
    policy_version: policyVersion,
    prompt_version: PROMPT_VERSION,
    fallback_reason: motivo,
  };
}
