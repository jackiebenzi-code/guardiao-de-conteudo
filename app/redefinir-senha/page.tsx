"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabase = createClient();

  // O link do e-mail carrega o token no fragmento da URL; o cliente Supabase
  // lê isso sozinho e dispara PASSWORD_RECOVERY quando a sessão temporária
  // de recuperação fica pronta. Até lá, não sabemos se o link é válido.
  const [statusLink, setStatusLink] = useState<"verificando" | "valido" | "invalido">("verificando");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatusLink("valido");
    });

    // Se o evento já tiver disparado antes deste efeito montar, a sessão
    // recuperada já existe — trata como link válido também nesse caso.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatusLink((atual) => (atual === "verificando" ? "valido" : atual));
    });

    const timeout = setTimeout(() => {
      setStatusLink((atual) => (atual === "verificando" ? "invalido" : atual));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  async function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSalvo(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="container-app max-w-sm">
      <div className="card">
        <h1 className="mb-1 text-lg font-semibold">Criar nova senha</h1>

        {statusLink === "verificando" && (
          <p className="text-sm text-neutral-500">Verificando o link…</p>
        )}

        {statusLink === "invalido" && (
          <div className="space-y-3">
            <p className="text-sm text-risco-alto">
              Este link de redefinição é inválido ou expirou.
            </p>
            <a href="/esqueci-senha" className="text-sm underline">
              Pedir um novo link
            </a>
          </div>
        )}

        {statusLink === "valido" && !salvo && (
          <form onSubmit={aoSubmeter} className="space-y-4">
            <p className="mb-2 text-sm text-neutral-500">Escolha uma nova senha para sua conta.</p>
            <div>
              <label htmlFor="senha" className="label">
                Nova senha
              </label>
              <input
                id="senha"
                type="password"
                required
                minLength={8}
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirmarSenha" className="label">
                Confirmar nova senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                required
                minLength={8}
                className="input"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {erro && (
              <p role="alert" className="text-sm text-risco-alto">
                {erro}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar nova senha"}
            </button>
          </form>
        )}

        {salvo && <p className="text-sm text-risco-nenhum">Senha atualizada. Levando você ao painel…</p>}
      </div>
    </div>
  );
}
