export const DECISAO_INFO: Record<
  string,
  { rotulo: string; cor: string; explicacao: string }
> = {
  APROVADO: {
    rotulo: "Aprovado",
    cor: "text-risco-nenhum",
    explicacao: "Sem sinais materiais de risco para a idade e o contexto informados.",
  },
  APROVADO_COM_ORIENTACAO: {
    rotulo: "Aprovado com orientação",
    cor: "text-risco-baixo",
    explicacao: "Geralmente aceitável, mas vale acompanhar ou conversar antes.",
  },
  REVISAO: {
    rotulo: "Revisar com você",
    cor: "text-risco-moderado",
    explicacao: "Contexto insuficiente ou ambíguo — decida você com o que sabe.",
  },
  BLOQUEADO: {
    rotulo: "Bloqueado",
    cor: "text-risco-alto",
    explicacao: "Evidências de risco alto para a idade informada.",
  },
  ESCALONAMENTO_PRIORITARIO: {
    rotulo: "Atenção imediata",
    cor: "text-risco-critico",
    explicacao: "Risco crítico identificado. Revise agora.",
  },
};

export const NIVEL_COR: Record<string, string> = {
  NENHUM: "text-risco-nenhum",
  BAIXO: "text-risco-baixo",
  MODERADO: "text-risco-moderado",
  ALTO: "text-risco-alto",
  CRITICO: "text-risco-critico",
};
