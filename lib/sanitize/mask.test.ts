import { describe, expect, it } from "vitest";
import { LIMITE_CARACTERES_ENTRADA, mascararDadosPessoais } from "./mask";

describe("mascararDadosPessoais", () => {
  it("não mexe em texto sem dado pessoal", () => {
    const { higienizado, ocorrencias } = mascararDadosPessoais(
      "Vídeo engraçado de um gato tocando piano."
    );
    expect(higienizado).toBe("Vídeo engraçado de um gato tocando piano.");
    expect(ocorrencias).toBe(0);
  });

  it("mascara e-mail", () => {
    const { higienizado, ocorrencias } = mascararDadosPessoais(
      "Me chama em joaozinho.teste@exemplo.com.br pra combinar."
    );
    expect(higienizado).toContain("[E-MAIL_OCULTO]");
    expect(higienizado).not.toContain("joaozinho.teste@exemplo.com.br");
    expect(ocorrencias).toBeGreaterThanOrEqual(1);
  });

  it("mascara telefone brasileiro", () => {
    const { higienizado, ocorrencias } = mascararDadosPessoais(
      "Me liga no (11) 91234-5678 hoje à noite."
    );
    expect(higienizado).toContain("[TELEFONE_OCULTO]");
    expect(higienizado).not.toContain("91234-5678");
    expect(ocorrencias).toBeGreaterThanOrEqual(1);
  });

  it("mascara CEP", () => {
    const { higienizado, ocorrencias } = mascararDadosPessoais(
      "Moro perto do CEP 01310-100, no centro."
    );
    expect(higienizado).toContain("_OCULTO]");
    expect(higienizado).not.toContain("01310-100");
    expect(ocorrencias).toBeGreaterThanOrEqual(1);
  });

  it("mascara @usuário de rede social", () => {
    const { higienizado, ocorrencias } = mascararDadosPessoais(
      "Segue o @joaozinho_2015 lá no perfil dele."
    );
    expect(higienizado).toContain("[USUARIO_OCULTO]");
    expect(higienizado).not.toContain("@joaozinho_2015");
    expect(ocorrencias).toBeGreaterThanOrEqual(1);
  });

  it("mascara mais de um dado pessoal no mesmo texto", () => {
    const { ocorrencias } = mascararDadosPessoais(
      "Fala @joaozinho, me manda um e-mail em teste@exemplo.com ou liga (11) 98888-7777."
    );
    expect(ocorrencias).toBeGreaterThanOrEqual(3);
  });

  it("expõe o limite de caracteres de entrada usado pela API", () => {
    expect(LIMITE_CARACTERES_ENTRADA).toBe(8000);
  });
});
