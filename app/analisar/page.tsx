"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Perfil {
  id: string;
  apelido: string;
  faixa_etaria_min: number;
  faixa_etaria_max: number;
}

export default function AnalisarPage() {
  const router = useRouter();
  const supabase = createClient();

  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [perfilId, setPerfilId] = useState<string>("");
  const [tipo, setTipo] = useState<"url" | "texto" | "descricao">("descricao");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("child_profiles")
      .select("id, apelido, faixa_etaria_min, faixa_etaria_max")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setPerfis(data ?? []);
        const primeiro = data?.[0];
        if (primeiro) setPerfilId(primeiro.id);
      });
  }, []);

  const perfilSelecionado = perfis.find((p) => p.id === perfilId);

  async function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const resposta = await fetch("/api/analisar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        titulo: titulo || undefined,
        conteudo,
        child_profile_id: perfilId || null,
        faixa_etaria_min: perfilSelecionado?.faixa_etaria_min,
        faixa_etaria_max: perfilSelecionado?.faixa_etaria_max,
      }),
    });

    const dados = await resposta.json();
    setEnviando(false);

    if (!resposta.ok) {
      setErro(dados.erro ?? "Erro ao analisar.");
      return;
    }

    router.push(`/analises/${dados.analysisId}`);
  }

  return (
    <div className="container-app max-w-lg">
      <h1 className="mb-1 text-lg font-semibold">Analisar conteúdo</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Cole um link, título de vídeo/canal, ou o texto em si. A análise é sempre
        conservadora: na dúvida, vai para revisão — nunca aprova sozinha.
      </p>

      {perfis.length === 0 && (
        <p className="card mb-4 text-sm">
          Você ainda não cadastrou um perfil de criança.{" "}
          <a href="/perfil" className="underline">
            Cadastrar agora
          </a>{" "}
          (opcional — sem perfil, a análise assume 7 a 12 anos).
        </p>
      )}

      <form onSubmit={aoSubmeter} className="card space-y-4">
        {perfis.length > 0 && (
          <div>
            <label htmlFor="perfil" className="label">
              Perfil
            </label>
            <select
              id="perfil"
              className="input"
              value={perfilId}
              onChange={(e) => setPerfilId(e.target.value)}
            >
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.apelido} ({p.faixa_etaria_min}–{p.faixa_etaria_max} anos)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="tipo" className="label">
            Tipo de conteúdo
          </label>
          <select
            id="tipo"
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
          >
            <option value="descricao">Descrição de vídeo, canal ou jogo</option>
            <option value="url">Link (URL)</option>
            <option value="texto">Texto colado</option>
          </select>
        </div>

        <div>
          <label htmlFor="titulo" className="label">
            Título ou contexto (opcional)
          </label>
          <input
            id="titulo"
            className="input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ex.: nome do vídeo, canal ou situação"
          />
        </div>

        <div>
          <label htmlFor="conteudo" className="label">
            {tipo === "url" ? "Link" : "Conteúdo"}
          </label>
          <textarea
            id="conteudo"
            required
            className="input"
            rows={tipo === "url" ? 2 : 8}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            maxLength={8000}
            placeholder={
              tipo === "url"
                ? "https://…"
                : "Cole aqui o texto, a descrição do vídeo/canal, ou o que ele te mostrou"
            }
          />
          <p className="mt-1 text-xs text-neutral-400">{conteudo.length}/8000</p>
        </div>

        {erro && (
          <p role="alert" className="text-sm text-risco-alto">
            {erro}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={enviando}>
          {enviando ? "Analisando…" : "Analisar"}
        </button>
      </form>
    </div>
  );
}
