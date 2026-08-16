import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em componentes de cliente ("use client").
 * Usa a publishable key — segura para expor ao navegador, RLS protege os dados.
 *
 * Os valores públicos ficam embutidos como fallback porque são, por definição,
 * expostos ao navegador. Assim o app funciona mesmo se a variável de ambiente
 * não estiver disponível no momento do build.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://kssuvgxwsixpercudybo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_yuP1wlwAdK1h0Sqt71uLuA_LQ7msX4b";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
