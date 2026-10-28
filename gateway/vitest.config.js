import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: { JWT_SECRET: "secreto-de-prueba", LOG_LEVEL: "silent" },
  },
});
