import { defineConfig } from "vitest/config";

// Cobre só as peças puras e sem infraestrutura: motor de políticas e
// mascaramento de dados pessoais. São as duas que garantem "nunca aprova
// sozinho" — ver docs/CHECKLIST_CONCLUSAO.md.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
