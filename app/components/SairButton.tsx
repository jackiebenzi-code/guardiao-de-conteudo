"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Botão de logout. Faltava uma forma de sair da conta pela interface — sem
 * isso, o único jeito de encerrar a sessão era apagar cookies manualmente.
 */
export default function SairButton() {
  const router = useRouter();
  const supabase = createClient();

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={sair} className="hover:underline">
      Sair
    </button>
  );
}
