import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
 * Propaga a sessão do responsável via cookies, então toda query já respeita RLS
 * como o próprio responsável autenticado — nunca usamos service role aqui.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component sem permissão de escrita —
            // o middleware cuida de manter a sessão viva nesse caso.
          }
        },
      },
    }
  );
}
