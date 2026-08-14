/**
 * Mascaramento de dados pessoais antes de qualquer envio ao modelo de IA
 * (Especificação, Seção 9: "mascarar nomes, telefones, endereços, usuários
 * e outros identificadores antes de enviar conteúdo ao modelo").
 *
 * É deliberadamente conservador: prefere mascarar demais a vazar um dado.
 * Não é infalível — é uma camada, não a única defesa.
 */

const PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "E-MAIL", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  // Telefones BR: (11) 91234-5678, 11912345678, +55 11 91234-5678 etc.
  {
    label: "TELEFONE",
    regex: /(\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/g,
  },
  { label: "CPF", regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
  { label: "CEP", regex: /\b\d{5}-?\d{3}\b/g },
  // @handle de rede social
  { label: "USUARIO", regex: /(?<=\s|^)@[a-zA-Z0-9_.]{2,}/g },
];

export function mascararDadosPessoais(textoOriginal: string): {
  higienizado: string;
  ocorrencias: number;
} {
  let higienizado = textoOriginal;
  let ocorrencias = 0;

  for (const { label, regex } of PATTERNS) {
    higienizado = higienizado.replace(regex, () => {
      ocorrencias += 1;
      return `[${label}_OCULTO]`;
    });
  }

  return { higienizado, ocorrencias };
}

/** Limite de tamanho de entrada — evita abuso e custo desnecessário de modelo. */
export const LIMITE_CARACTERES_ENTRADA = 8000;
