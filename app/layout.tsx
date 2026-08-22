import type { Metadata } from "next";
import "./globals.css";
import SairButton from "./components/SairButton";

export const metadata: Metadata = {
  title: "Guardião de Conteúdo — protótipo pessoal",
  description:
    "Análise de conteúdo digital para apoiar decisões de proteção. Protótipo pessoal, não comercial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow"
        >
          Pular para o conteúdo principal
        </a>
        <header className="border-b border-neutral-200 bg-white">
          <div className="container-app flex items-center justify-between py-4">
            <a href="/" className="text-base font-semibold tracking-tight">
              Guardião de Conteúdo <span className="text-neutral-400 font-normal">· protótipo pessoal</span>
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:underline">
                Painel
              </a>
              <a href="/analisar" className="hover:underline">
                Analisar conteúdo
              </a>
              <a href="/confianca" className="hover:underline">
                Lista de confiança
              </a>
              <a href="/perfil" className="hover:underline">
                Perfil da criança
              </a>
              <SairButton />
            </nav>
          </div>
        </header>
        <main id="conteudo-principal">{children}</main>
        <footer className="container-app pt-2 pb-8 text-xs text-neutral-400">
          Este é um protótipo pessoal, não vendido. A IA é um apoio à decisão — não garante
          segurança absoluta e não substitui seu acompanhamento.
        </footer>
      </body>
    </html>
  );
}
