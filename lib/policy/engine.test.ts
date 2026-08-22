import { describe, expect, it } from "vitest";
import { CATEGORIAS_RISCO, type AnaliseModelo, type CategoriaSlug } from "../ai/schema";
import { aplicarMotorDePoliticas, resultadoFallback, type RegrasPolitica } from "./engine";

/**
 * Mesma política aplicada em produção (supabase/migrations/0001_schema_inicial_v0.sql,
 * linha "v1-protecao-reforcada"). Testamos contra a política real, não uma fictícia,
 * pra esses testes realmente garantirem o comportamento em uso.
 */
const POLITICA_REAL: RegrasPolitica = {
  prevalencia_categoria_critica: true,
  fallback_em_falha: "REVISAO",
  thresholds_padrao: { bloqueia_a_partir_de: "ALTO", revisa_a_partir_de: "MODERADO" },
  overrides_categoria: {
    violencia_ou_ameaca: { bloqueia_a_partir_de: "MODERADO" },
    incentivo_comportamento_perigoso: { bloqueia_a_partir_de: "MODERADO" },
    conteudo_assustador_inadequado_idade: { bloqueia_a_partir_de: "MODERADO" },
    autolesao: { bloqueia_a_partir_de: "BAIXO", escalonamento_a_partir_de: "MODERADO" },
  },
  confianca_baixa_reduz_para: "REVISAO",
};

/** Constrói uma saída de modelo com as 16 categorias em NENHUM, exceto as sobrescritas. */
function saidaModelo(
  overrides: Partial<Record<CategoriaSlug, { level: string; confidence?: string }>> = {}
): AnaliseModelo {
  return {
    summary_for_parent: "Resumo de teste.",
    age_range_evaluated: { minimum: 7, maximum: 12 },
    risk_categories: CATEGORIAS_RISCO.map(({ slug }) => {
      const override = overrides[slug];
      return {
        category: slug,
        level: (override?.level ?? "NENHUM") as AnaliseModelo["risk_categories"][number]["level"],
        confidence: (override?.confidence ?? "ALTA") as AnaliseModelo["risk_categories"][number]["confidence"],
        evidence: [],
        missing_context: [],
        recommended_action: "Nenhuma ação necessária.",
      };
    }),
    protective_factors: [],
    limitations: [],
    immediate_parent_actions: [],
  };
}

describe("aplicarMotorDePoliticas — política real de produção", () => {
  it("aprova quando todas as categorias estão em NENHUM", () => {
    const resultado = aplicarMotorDePoliticas(saidaModelo(), POLITICA_REAL, "modelo-teste", "v1-teste");
    expect(resultado.decision).toBe("APROVADO");
    expect(resultado.requires_human_review).toBe(false);
  });

  it("aprova com orientação quando só há um sinal BAIXO", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ linguagem_ofensiva: { level: "BAIXO" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("APROVADO_COM_ORIENTACAO");
    expect(resultado.requires_human_review).toBe(true);
  });

  it("manda para revisão um MODERADO em categoria sem override, com confiança alta", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ bullying_humilhacao_intimidacao: { level: "MODERADO", confidence: "ALTA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("REVISAO");
  });

  it("bloqueia um ALTO em categoria sem override, com confiança alta", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ bullying_humilhacao_intimidacao: { level: "ALTO", confidence: "ALTA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("BLOQUEADO");
  });

  it("rebaixa para revisão um ALTO com confiança BAIXA (nunca bloqueia assertivamente sem confiança)", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ bullying_humilhacao_intimidacao: { level: "ALTO", confidence: "BAIXA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("REVISAO");
  });

  it("escalona prioritariamente qualquer categoria CRITICO, mesmo com confiança baixa", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ conteudo_sexual_ou_sugestivo: { level: "CRITICO", confidence: "BAIXA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("ESCALONAMENTO_PRIORITARIO");
    expect(resultado.requires_human_review).toBe(true);
  });

  it("CRITICO escalona mesmo se uma política futura desligar prevalencia_categoria_critica", () => {
    const politicaSemFlag: RegrasPolitica = {
      ...POLITICA_REAL,
      prevalencia_categoria_critica: false,
    };
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ conteudo_sexual_ou_sugestivo: { level: "CRITICO", confidence: "ALTA" } }),
      politicaSemFlag,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("ESCALONAMENTO_PRIORITARIO");
  });

  it("aplica o threshold reforçado de violência/ameaça: MODERADO já bloqueia", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ violencia_ou_ameaca: { level: "MODERADO", confidence: "ALTA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("BLOQUEADO");
  });

  it("aplica o threshold reforçado de conteúdo assustador: MODERADO já bloqueia", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ conteudo_assustador_inadequado_idade: { level: "MODERADO", confidence: "ALTA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("BLOQUEADO");
  });

  it("escalona autolesão a partir de MODERADO, por override específico", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ autolesao: { level: "MODERADO", confidence: "ALTA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("ESCALONAMENTO_PRIORITARIO");
  });

  it("bloqueia autolesão já a partir de BAIXO, por override específico", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({ autolesao: { level: "BAIXO", confidence: "ALTA" } }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("BLOQUEADO");
  });

  it("usa sempre a decisão mais severa entre várias categorias", () => {
    const resultado = aplicarMotorDePoliticas(
      saidaModelo({
        linguagem_ofensiva: { level: "BAIXO" },
        bullying_humilhacao_intimidacao: { level: "MODERADO", confidence: "ALTA" },
        conteudo_sexual_ou_sugestivo: { level: "CRITICO", confidence: "ALTA" },
      }),
      POLITICA_REAL,
      "modelo-teste",
      "v1-teste"
    );
    expect(resultado.decision).toBe("ESCALONAMENTO_PRIORITARIO");
  });
});

describe("resultadoFallback — nunca aprova sozinho", () => {
  it("qualquer falha do modelo vira REVISAO, nunca aprovação", () => {
    const resultado = resultadoFallback("timeout no provedor de IA", "v1-teste");
    expect(resultado.decision).toBe("REVISAO");
    expect(resultado.requires_human_review).toBe(true);
    expect(resultado.model_version).toBe("indisponivel");
    expect(resultado.fallback_reason).toBe("timeout no provedor de IA");
  });
});
