"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Regra {
  id: string;
  tipo_item: string;
  identificador_canonico: string;
  titulo: string | null;
  tipo_autorizacao: string;
  criado_em: string;
  revogado_em: string | null;
}

export default function ConfiancaPage() {
  const supabase = createClient();
  const [regras, setRegras] = useState<Regra[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("trusted_content_rules")
      .select("id, tipo_item, identificador_canonico, titulo, tipo_autorizacao, criado_em, revogado_em")
      .is("revogado_em", null)
      .order("criado_em", { ascending: false });
    setRegras(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function revogar(id: string) {
    await supabase.from("trusted_content_rules").update({ revogado_em: new Date().toISOString() }).eq("id", id);
    await carregar();
  }

  return (
    <div className="container-app max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Lista de Confiança</h1>
        <p className="text-sm text-neutral-500">
          Itens ou canais que você já aprovou. Isso reduz repetição, mas não desliga a
          segurança: risco crítico continua bloqueando mesmo em fonte autorizada, e novos
          conteúdos da mesma fonte continuam sendo analisados.
        </p>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : regras.length === 0 ? (
        <p className="card text-sm text-neutral-500">Nenhum item autorizado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {regras.map((r) => (
            <li key={r.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{r.titulo || r.identificador_canonico}</p>
                <p className="text-xs text-neutral-500">
                  {r.tipo_item} · {r.tipo_autorizacao === "CANAL" ? "canal/fonte inteira" : "só este item"}
                </p>
              </div>
              <button className="btn-secondary" onClick={() => revogar(r.id)}>
                Revogar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
