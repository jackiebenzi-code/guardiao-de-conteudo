"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  childProfileId: string | null;
  tipoItem: string;
  identificadorCanonico: string;
  titulo: string | null;
}

export default function AdicionarConfianca({
  childProfileId,
  tipoItem,
  identificadorCanonico,
  titulo,
}: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<"ocioso" | "salvando" | "salvo" | "erro">("ocioso");

  async function adicionar(tipoAutorizacao: "UNICA" | "CANAL") {
    setStatus("salvando");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("erro");
      return;
    }

    const { error } = await supabase.from("trusted_content_rules").insert({
      guardian_id: user.id,
      child_profile_id: childProfileId,
      tipo_item: tipoItem,
      identificador_canonico: identificadorCanonico,
      titulo,
      tipo_autorizacao: tipoAutorizacao,
      continuar_analisando: true,
    });

    setStatus(error ? "erro" : "salvo");
  }

  if (status === "salvo") {
    return (
      <p className="text-sm text-risco-nenhum">
        Adicionado à Lista de Confiança. Novos conteúdos desse item continuam sendo analisados.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-500">
        Quer lembrar essa decisão pra próxima vez? Isso não desliga a análise — conteúdo
        crítico continua bloqueando mesmo assim.
      </p>
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => adicionar("UNICA")} disabled={status === "salvando"}>
          Confiar só neste item
        </button>
        <button className="btn-secondary" onClick={() => adicionar("CANAL")} disabled={status === "salvando"}>
          Confiar na fonte/canal
        </button>
      </div>
      {status === "erro" && <p className="text-sm text-risco-alto">Não foi possível salvar.</p>}
    </div>
  );
}
