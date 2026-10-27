import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createAuthService } from "../src/auth/auth.service.js";
import { createInMemoryUserRepository } from "./helpers/in-memory-user-repository.js";

// Test de integración: request HTTP real contra la app completa
// (rutas + validación Zod + JWT + bcrypt + servicio). Solo la base de datos está reemplazada.
let app;
let authService;

beforeEach(async () => {
  authService = createAuthService(createInMemoryUserRepository());
  await authService.ensureDefaultUser();
  app = createApp({ authService });
});

async function loginAsAdmin() {
  const res = await request(app).post("/login").send({ username: "admin", password: "1234" });
  return res.body.token;
}

describe("GET /health", () => {
  it("responde ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "auth-service" });
  });
});

describe("POST /login", () => {
  it("devuelve un JWT con credenciales correctas", async () => {
    const res = await request(app).post("/login").send({ username: "admin", password: "1234" });
    expect(res.status).toBe(200);
    expect(res.body.token.split(".")).toHaveLength(3);
  });

  it("responde 401 con una clave incorrecta", async () => {
    const res = await request(app).post("/login").send({ username: "admin", password: "mal" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales inválidas");
  });

  it("responde 401 si el usuario no existe", async () => {
    const res = await request(app).post("/login").send({ username: "nadie", password: "1234" });
    expect(res.status).toBe(401);
  });

  it("responde 400 si faltan datos", async () => {
    const res = await request(app).post("/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe("GET /me", () => {
  it("responde 401 sin token", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
  });

  it("responde 401 con un token inválido", async () => {
    const res = await request(app).get("/me").set("Authorization", "Bearer abc");
    expect(res.status).toBe(401);
  });

  it("devuelve el perfil con el contador en cero", async () => {
    const token = await loginAsAdmin();
    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ username: "admin", productsCreated: 0 });
  });

  it("el contador sube cuando llega el evento product.created", async () => {
    const token = await loginAsAdmin();

    // Lo mismo que hace el consumidor de RabbitMQ al recibir el evento
    await authService.registerProductCreated("admin");
    await authService.registerProductCreated("admin");

    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.body.productsCreated).toBe(2);
  });
});
