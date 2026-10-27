import { defineConfig, devices } from "@playwright/test";

// Pruebas end-to-end: abren el frontend en un navegador real y usan la app como una persona.
//
// Por defecto arrancan solas:
//   1) un servidor de pruebas con los dos servicios reales (auth en :4000, catálogo en :3000)
//      con bases de datos en memoria  -> tests/e2e/test-server.js
//   2) el frontend con Vite en :5173
//
// Si ya tenés algo corriendo en esos puertos (por ejemplo `docker compose up`),
// Playwright lo reutiliza y las pruebas corren contra el sistema real.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/e2e/test-server.js",
      url: "http://localhost:3000/health",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: "npm --prefix frontend run dev -- --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
