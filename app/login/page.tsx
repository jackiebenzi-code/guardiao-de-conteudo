"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState<"entrar" | "criar_conta">("entrar");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { data, error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    if (modo === "criar_conta" && data.user) {
      // Cria o registro em `guardians`, espelhando o auth.users — RLS já garante
      // que só o próprio dono pode ler/editar essa linha.
      await supabase.from("guardians").upsert({ id: data.user.id, email });
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="container-app max-w-sm">
      <div className="card">
        <h1 className="mb-1 text-lg font-semibold">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Acesso restrito a você, responsável.
        </p>

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
          <div>
            <label htmlFor="senha" className="label">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={8}
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-risco-alto">
              {erro}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-neutral-500 underline"
            onClick={() => setModo(modo === "entrar" ? "criar_conta" : "entrar")}
          >
            {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
          </button>
          {modo === "entrar" && (
            <a href="/esqueci-senha" className="text-neutral-500 underline">
              Esqueci minha senha
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
