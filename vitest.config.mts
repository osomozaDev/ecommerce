import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(process.cwd(), "test/stubs/server-only.ts"),
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
    // Solo unit tests de src/. Los e2e (e2e/*.spec.ts) son de Playwright.
    include: ["src/**/*.test.ts"],
  },
});
