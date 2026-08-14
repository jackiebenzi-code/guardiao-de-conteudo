import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta sóbria, alto contraste — pensada para acessibilidade (WCAG 2.1 AA),
        // não para venda. Sem vermelho-alarme como cor dominante.
        risco: {
          nenhum: "#1a7f37",
          baixo: "#9a6700",
          moderado: "#bc4c00",
          alto: "#cf222e",
          critico: "#82071e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
