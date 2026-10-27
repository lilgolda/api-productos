// Servidor de pruebas para el E2E: levanta los DOS servicios reales (misma app, mismas rutas,
// mismo JWT y misma validación) pero con bases de datos en memoria y sin RabbitMQ.
// El "evento" product.created se entrega directo, como lo haría RabbitMQ.
process.env.JWT_SECRET ??= "secreto-e2e";
process.env.LOG_LEVEL ??= "silent";

const { createAuthService } = await import("../../auth-service/src/auth/auth.service.js");
const { createApp: createAuthApp } = await import("../../auth-service/src/app.js");
const { createInMemoryUserRepository } = await import("../../auth-service/tests/helpers/in-memory-user-repository.js");

const { createProductService } = await import("../../catalog-service/src/products/product.service.js");
const { createApp: createCatalogApp } = await import("../../catalog-service/src/app.js");
const { createInMemoryProductRepository } = await import("../../catalog-service/tests/helpers/in-memory-product-repository.js");

const authService = createAuthService(createInMemoryUserRepository());
await authService.ensureDefaultUser();

const events = {
  publish: async (key, payload) => {
    if (key === "product.created") await authService.registerProductCreated(payload.createdBy);
  },
};
const productService = createProductService(createInMemoryProductRepository(), events);

createAuthApp({ authService }).listen(4000, () => console.log("auth (pruebas) en :4000"));
createCatalogApp({ productService }).listen(3000, () => console.log("catalogo (pruebas) en :3000"));
