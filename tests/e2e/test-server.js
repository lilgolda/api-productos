process.env.JWT_SECRET ??= "secreto-e2e";
process.env.LOG_LEVEL ??= "silent";

const { createAuthService } = await import("../../auth-service/src/auth/auth.service.js");
const { createApp: createAuthApp } = await import("../../auth-service/src/app.js");
const { createInMemoryUserRepository } = await import("../../auth-service/tests/helpers/in-memory-user-repository.js");

const { createProductService } = await import("../../catalog-service/src/products/product.service.js");
const { createKnownUserService } = await import("../../catalog-service/src/users/known-user.service.js");
const { createApp: createCatalogApp } = await import("../../catalog-service/src/app.js");
const { createInMemoryProductRepository } = await import("../../catalog-service/tests/helpers/in-memory-product-repository.js");

const { createApp: createGatewayApp } = await import("../../gateway/src/app.js");

const knownUsers = new Map();
const knownUserService = createKnownUserService({
  save: async ({ username, registeredAt }) => {
    if (!knownUsers.has(username)) knownUsers.set(username, registeredAt);
  },
});
const authEvents = {
  publish: async (key, payload) => {
    if (key === "usuario.creado") await knownUserService.recordUserCreated(payload);
  },
};
const authService = createAuthService(createInMemoryUserRepository(), authEvents);
await authService.ensureDefaultUser();

const catalogEvents = {
  publish: async (key, payload) => {
    if (key === "producto.creado") await authService.registerProductCreated(payload.createdBy);
  },
};
const productService = createProductService(createInMemoryProductRepository(), catalogEvents);

const listen = (app, port) => new Promise((resolve) => app.listen(port, resolve));

await listen(createAuthApp({ authService }), 4000);
await listen(createCatalogApp({ productService }), 3000);
await listen(createGatewayApp({ authUrl: "http://127.0.0.1:4000", catalogUrl: "http://127.0.0.1:3000" }), 8080);
console.log("servidor de pruebas listo: gateway :8080, auth :4000, catalogo :3000");
