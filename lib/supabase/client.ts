import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em componentes de cliente ("use client").
 * Usa a publishable key — segura para expor ao navegador, RLS protege os dados.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
