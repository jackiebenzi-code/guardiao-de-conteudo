"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Perfil {
  id: string;
  apelido: string;
  faixa_etaria_min: number;
  faixa_etaria_max: number;
  observacoes: string | null;
}

const PERFIL_VAZIO = { apelido: "", min: 7, max: 9, observacoes: "" };

export default function PerfilPage() {
  const supabase = createClient();
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [apelido, setApelido] = useState(PERFIL_VAZIO.apelido);
  const [min, setMin] = useState(PERFIL_VAZIO.min);
  const [max, setMax] = useState(PERFIL_VAZIO.max);
  const [observacoes, setObservacoes] = useState(PERFIL_VAZIO.observacoes);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("child_profiles")
      .select("id, apelido, faixa_etaria_min, faixa_etaria_max, observacoes")
      .order("created_at", { ascending: true });
    setPerfis(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function limparFormulario() {
    setEditandoId(null);
    setApelido(PERFIL_VAZIO.apelido);
    setMin(PERFIL_VAZIO.min);
    setMax(PERFIL_VAZIO.max);
    setObservacoes(PERFIL_VAZIO.observacoes);
  }

  function iniciarEdicao(p: Perfil) {
    setEditandoId(p.id);
    setApelido(p.apelido);
    setMin(p.faixa_etaria_min);
    setMax(p.faixa_etaria_max);
    setObservacoes(p.observacoes ?? "");
    setMensagem(null);
  }

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);

    if (editandoId) {
      const { error } = await supabase
        .from("child_profiles")
        .update({
          apelido,
          faixa_etaria_min: min,
          faixa_etaria_max: max,
          observacoes: observacoes || null,
        })
        .eq("id", editandoId);

      setSalvando(false);
      if (error) {
        setMensagem(`Erro ao salvar: ${error.message}`);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMensagem("Sessão expirada, faça login novamente.");
        setSalvando(false);
        return;
      }

      const { error } = await supabase.from("child_profiles").insert({
        guardian_id: user.id,
        apelido,
        faixa_etaria_min: min,
        faixa_etaria_max: max,
        observacoes: observacoes || null,
      });

      setSalvando(false);
      if (error) {
        setMensagem(`Erro ao salvar: ${error.message}`);
        return;
      }
    }

    limparFormulario();
    await carregar();
  }

  async function excluirPerfil(id: string) {
    const confirmado = window.confirm(
      "Excluir este perfil? Análises já feitas continuam no histórico, só deixam de estar ligadas a ele."
    );
    if (!confirmado) return;

    setExcluindoId(id);
    setMensagem(null);
    const { error } = await supabase.from("child_profiles").delete().eq("id", id);
    setExcluindoId(null);

    if (error) {
      setMensagem(`Erro ao excluir: ${error.message}`);
      return;
    }
    if (editandoId === id) limparFormulario();
    await carregar();
  }

  return (
    <div className="container-app max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Perfil da criança</h1>
        <p className="text-sm text-neutral-500">
          Usado para calibrar a faixa etária das análises. Guardamos o mínimo possível:
          apelido e faixa etária, nada de dado que identifique a criança fora daqui.
        </p>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        perfis.length > 0 && (
          <ul className="space-y-2">
            {perfis.map((p) => (
              <li key={p.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{p.apelido}</p>
                    <p className="text-sm text-neutral-500">
                      {p.faixa_etaria_min}–{p.faixa_etaria_max} anos
                    </p>
                    {p.observacoes && <p className="mt-1 text-sm text-neutral-600">{p.observacoes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" className="btn-secondary" onClick={() => iniciarEdicao(p)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => excluirPerfil(p.id)}
                      disabled={excluindoId === p.id}
                    >
                      {excluindoId === p.id ? "Excluindo…" : "Excluir"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      <form onSubmit={salvarPerfil} className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{editandoId ? "Editar perfil" : "Adicionar perfil"}</h2>
          {editandoId && (
            <button type="button" className="text-sm text-neutral-500 underline" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </div>
        <div>
          <label htmlFor="apelido" className="label">
            Apelido
          </label>
          <input
            id="apelido"
            className="input"
            required
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="ex.: pequeno"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="min" className="label">
              Idade mínima considerada
            </label>
            <input
              id="min"
              type="number"
              className="input"
              min={0}
              max={17}
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="max" className="label">
              Idade máxima considerada
            </label>
            <input
              id="max"
              type="number"
              className="input"
              min={0}
              max={17}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label htmlFor="observacoes" className="label">
            Observações (opcional, fica só entre você e o sistema)
          </label>
          <textarea
            id="observacoes"
            className="input"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="ex.: gatilhos conhecidos, o que priorizar na análise"
          />
        </div>
        {mensagem && <p className="text-sm text-risco-alto">{mensagem}</p>}
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? "Salvando…" : editandoId ? "Salvar alterações" : "Salvar perfil"}
        </button>
      </form>
    </div>
  );
}
