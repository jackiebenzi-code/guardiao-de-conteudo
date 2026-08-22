"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setEnviando(false);

    // Não revela se o e-mail existe ou não na conta — mesma mensagem nos dois
    // casos, pra não virar uma forma de descobrir contas cadastradas.
    if (error) {
      setErro(error.message);
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="container-app max-w-sm">
      <div className="card">
        <h1 className="mb-1 text-lg font-semibold">Esqueci minha senha</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Informe o e-mail da sua conta. Se ele estiver cadastrado, enviamos um link
          para você criar uma nova senha.
        </p>

        {enviado ? (
          <p className="text-sm text-risco-nenhum">
            Se esse e-mail estiver cadastrado, o link de redefinição já foi enviado.
            Confira também a caixa de spam.
          </p>
        ) : (
          <form onSubmit={aoSubmeter} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {erro && (
              <p role="alert" className="text-sm text-risco-alto">
                {erro}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <a href="/login" className="mt-4 block text-sm text-neutral-500 underline">
          Voltar para o login
        </a>
      </div>
    </div>
  );
}
