import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Variables que usan los tests (no se toca ninguna base de datos real)
    env: { JWT_SECRET: "secreto-de-prueba", LOG_LEVEL: "silent" },
  },
});
