import test from "node:test";
import assert from "node:assert/strict";
import { createAuthService } from "./auth.service.js";
import { InvalidCredentialsError, NotFoundError } from "../shared/errors.js";

process.env.JWT_SECRET = "secreto-de-prueba";

function fakeRepository() {
  const users = new Map();
  return {
    findByUsername: async (username) => users.get(username) ?? null,
    create: async (data) => {
      const user = { productsCreated: 0, ...data };
      users.set(user.username, user);
      return user;
    },
    incrementProductsCreated: async (username) => {
      const user = users.get(username);
      if (user) user.productsCreated += 1;
    },
  };
}

test("crea el usuario admin una sola vez", async () => {
  const repo = fakeRepository();
  const service = createAuthService(repo);
  await service.ensureDefaultUser();
  await service.ensureDefaultUser();
  const profile = await service.getProfile("admin");
  assert.equal(profile.username, "admin");
});

test("login correcto devuelve un JWT con el usuario", async () => {
  const service = createAuthService(fakeRepository());
  await service.ensureDefaultUser();
  const token = await service.login({ username: "admin", password: "1234" });
  assert.equal(service.verifyToken(token).username, "admin");
});

test("login con datos incorrectos lanza InvalidCredentialsError", async () => {
  const service = createAuthService(fakeRepository());
  await service.ensureDefaultUser();
  await assert.rejects(() => service.login({ username: "admin", password: "mal" }), InvalidCredentialsError);
  await assert.rejects(() => service.login({ username: "nadie", password: "1234" }), InvalidCredentialsError);
});

test("registerProductCreated suma uno al contador del usuario", async () => {
  const service = createAuthService(fakeRepository());
  await service.ensureDefaultUser();
  await service.registerProductCreated("admin");
  await service.registerProductCreated("admin");
  assert.equal((await service.getProfile("admin")).productsCreated, 2);
});

test("getProfile falla si el usuario no existe", async () => {
  const service = createAuthService(fakeRepository());
  await assert.rejects(() => service.getProfile("nadie"), NotFoundError);
});
