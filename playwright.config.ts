import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra el dev server en MODO FIXTURES: determinista, sin red externa
 * ni credenciales. El env de webServer manda sobre .env.local (Next no
 * sobrescribe variables ya definidas en el proceso).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    env: {
      COMMERCE_DATA_SOURCE: "fixtures",
      TENANT_ID: "default",
      ADMIN_SECRET: "test-admin",
      TENANTS_URL: "file:.dev-tenants.json",
    },
  },
});
