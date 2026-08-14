import { z } from "zod";

/**
 * As 16 categorias de risco da Especificação (Parte II, Seção 5).
 * O slug é o identificador estável usado no banco e no motor de políticas;
 * o rótulo é o texto exibido ao responsável.
 */
export const CATEGORIAS_RISCO = [
  { slug: "aliciamento_ou_aproximacao_inadequada", rotulo: "Aliciamento ou aproximação inadequada" },
  { slug: "bullying_humilhacao_intimidacao", rotulo: "Bullying, humilhação ou intimidação" },
  { slug: "conteudo_sexual_ou_sugestivo", rotulo: "Conteúdo sexual ou sugestivo" },
  { slug: "violencia_ou_ameaca", rotulo: "Violência ou ameaça" },
  { slug: "linguagem_ofensiva", rotulo: "Linguagem ofensiva" },
  { slug: "incentivo_comportamento_perigoso", rotulo: "Incentivo a comportamento perigoso" },
  { slug: "autolesao", rotulo: "Sinais relacionados a risco de autolesão" },
  { slug: "manipulacao_emocional", rotulo: "Manipulação emocional" },
  { slug: "extorsao_ou_chantagem", rotulo: "Extorsão ou chantagem" },
  { slug: "tentativa_obter_dados_pessoais", rotulo: "Tentativa de obter dados pessoais" },
  { slug: "publicidade_manipuladora", rotulo: "Publicidade manipuladora" },
  { slug: "compras_por_sorte_apostas_recompensas_variaveis", rotulo: "Compras por sorte, apostas ou recompensas variáveis" },
  { slug: "desinformacao_direcionada_criancas", rotulo: "Desinformação direcionada a crianças" },
  { slug: "conteudo_assustador_inadequado_idade", rotulo: "Conteúdo assustador ou inadequado à faixa etária" },
  { slug: "risco_contato_fora_plataforma", rotulo: "Risco de contato fora da plataforma" },
  { slug: "conteudo_seguro_mas_inadequado_idade_informada", rotulo: "Conteúdo potencialmente seguro, mas inadequado para a idade informada" },
] as const;

export type CategoriaSlug = (typeof CATEGORIAS_RISCO)[number]["slug"];
const CATEGORIA_SLUGS = CATEGORIAS_RISCO.map((c) => c.slug) as [CategoriaSlug, ...CategoriaSlug[]];

export const NIVEL_RISCO = ["NENHUM", "BAIXO", "MODERADO", "ALTO", "CRITICO"] as const;
export const CONFIANCA = ["BAIXA", "MEDIA", "ALTA"] as const;
export const DECISAO = [
  "APROVADO",
  "APROVADO_COM_ORIENTACAO",
  "REVISAO",
  "BLOQUEADO",
  "ESCALONAMENTO_PRIORITARIO",
] as const;

/** Schema exato exigido do modelo — saída JSON estrita (Seção 7). */
export const AnaliseModeloSchema = z.object({
  summary_for_parent: z.string().min(1).max(600),
  age_range_evaluated: z.object({ minimum: z.number().int(), maximum: z.number().int() }),
  risk_categories: z
    .array(
      z.object({
        category: z.enum(CATEGORIA_SLUGS),
        level: z.enum(NIVEL_RISCO),
        confidence: z.enum(CONFIANCA),
        evidence: z.array(z.string()).max(5),
        missing_context: z.array(z.string()).max(5),
        recommended_action: z.string().min(1).max(300),
      })
    )
    .length(CATEGORIAS_RISCO.length),
  protective_factors: z.array(z.string()).max(10),
  limitations: z.array(z.string()).max(10),
  immediate_parent_actions: z.array(z.string()).max(10),
});

export type AnaliseModelo = z.infer<typeof AnaliseModeloSchema>;

/** Resultado final já com a decisão do motor de políticas aplicada. */
export interface ResultadoAnalise {
  decision: (typeof DECISAO)[number];
  summary_for_parent: string;
  age_range_evaluated: { minimum: number; maximum: number };
  risk_categories: AnaliseModelo["risk_categories"];
  protective_factors: string[];
  limitations: string[];
  requires_human_review: boolean;
  immediate_parent_actions: string[];
  model_version: string;
  policy_version: string;
  prompt_version: string;
  fallback_reason?: string;
}
