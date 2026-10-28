import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createAuthService } from "../src/auth/auth.service.js";
import { createInMemoryUserRepository } from "./helpers/in-memory-user-repository.js";

let app;
let authService;
let events;

beforeEach(async () => {
  events = { publish: vi.fn().mockResolvedValue(undefined) };
  authService = createAuthService(createInMemoryUserRepository(), events, { error: vi.fn() });
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

describe("POST /register", () => {
  it("crea el usuario (201), publica usuario.creado y ya puede iniciar sesión", async () => {
    const res = await request(app).post("/register").send({ username: "ana", password: "secreto1" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ username: "ana" });
    expect(events.publish).toHaveBeenCalledWith("usuario.creado", expect.objectContaining({ username: "ana" }));

    const login = await request(app).post("/login").send({ username: "ana", password: "secreto1" });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
  });

  it("responde 409 si el usuario ya existe", async () => {
    await request(app).post("/register").send({ username: "ana", password: "secreto1" });
    const res = await request(app).post("/register").send({ username: "ana", password: "otraclave" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("El usuario ya existe");
  });

  it("responde 400 si el usuario o la clave son muy cortos", async () => {
    const res = await request(app).post("/register").send({ username: "an", password: "123" });
    expect(res.status).toBe(400);
    const campos = res.body.errors.map((e) => e.path[0]);
    expect(campos).toEqual(expect.arrayContaining(["username", "password"]));
  });

  it("no deja registrar el usuario admin que ya existe", async () => {
    const res = await request(app).post("/register").send({ username: "admin", password: "secreto1" });
    expect(res.status).toBe(409);
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

  it("el contador sube cuando llega el evento producto.creado", async () => {
    const token = await loginAsAdmin();

    await authService.registerProductCreated("admin");
    await authService.registerProductCreated("admin");

    const res = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.body.productsCreated).toBe(2);
  });
});
