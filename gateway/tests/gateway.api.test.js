import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../src/app.js";

function startFakeService(name) {
  const received = [];
  const app = express();
  app.use(express.json());
  app.use((req, res) => {
    received.push({ method: req.method, url: req.url, authorization: req.headers.authorization, body: req.body });
    res.status(req.url === "/crea" ? 201 : 200).json({ service: name, url: req.url });
  });
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, received, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

let auth;
let catalog;
let gateway;

beforeAll(async () => {
  auth = await startFakeService("auth");
  catalog = await startFakeService("catalog");
  gateway = createApp({ authUrl: auth.url, catalogUrl: catalog.url });
});

afterAll(() => {
  auth.server.close();
  catalog.server.close();
});

describe("API Gateway", () => {
  it("GET /health responde sin llamar a ningún servicio", async () => {
    const res = await request(gateway).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "gateway" });
  });

  it("envía /auth/login al auth-service quitando el prefijo /auth", async () => {
    const res = await request(gateway).post("/auth/login").send({ username: "ana", password: "x" });
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("auth");
    const last = auth.received.at(-1);
    expect(last.url).toBe("/login");
    expect(last.body).toEqual({ username: "ana", password: "x" });
  });

  it("envía /products al catalog-service y mantiene la ruta completa", async () => {
    const res = await request(gateway).get("/products/123?orden=asc");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("catalog");
    expect(catalog.received.at(-1).url).toBe("/products/123?orden=asc");
  });

  it("reenvía el header Authorization sin tocarlo", async () => {
    await request(gateway).post("/products").set("Authorization", "Bearer token-de-prueba").send({ name: "A" });
    expect(catalog.received.at(-1).authorization).toBe("Bearer token-de-prueba");
    expect(catalog.received.at(-1).body).toEqual({ name: "A" });
  });

  it("conserva el método y el código de respuesta del servicio", async () => {
    const res = await request(gateway).put("/products/9").send({ name: "B" });
    expect(res.status).toBe(200);
    expect(catalog.received.at(-1).method).toBe("PUT");
    const del = await request(gateway).delete("/products/9");
    expect(catalog.received.at(-1).method).toBe("DELETE");
    expect(del.status).toBe(200);
  });

  it("no manda a ningún servicio las rutas que no conoce (404)", async () => {
    const before = auth.received.length + catalog.received.length;
    const res = await request(gateway).get("/otra-cosa");
    expect(res.status).toBe(404);
    expect(auth.received.length + catalog.received.length).toBe(before);
  });

  it("no confunde rutas que solo empiezan parecido (/authors, /productsx)", async () => {
    const before = auth.received.length + catalog.received.length;
    expect((await request(gateway).get("/authors")).status).toBe(404);
    expect((await request(gateway).get("/productsx")).status).toBe(404);
    expect(auth.received.length + catalog.received.length).toBe(before);
  });

  it("responde 502 si el servicio no está disponible", async () => {
    const down = createApp({ authUrl: "http://127.0.0.1:1", catalogUrl: catalog.url });
    const res = await request(down).post("/auth/login").send({ username: "a", password: "b" });
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("Servicio no disponible");
  });
});
