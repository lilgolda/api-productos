import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { createProductService } from "../src/products/product.service.js";
import { createInMemoryProductRepository } from "./helpers/in-memory-product-repository.js";

const token = jwt.sign({ username: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
const auth = { Authorization: `Bearer ${token}` };
const validProduct = { name: "Teclado", price: 45.5, stock: 10 };

let app;
let events;

beforeEach(() => {
  events = { publish: vi.fn().mockResolvedValue(undefined) };
  const productService = createProductService(createInMemoryProductRepository(), events, { error: vi.fn() });
  app = createApp({ productService });
});

describe("GET /health", () => {
  it("responde ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", service: "catalog-service" });
  });
});

describe("POST /products", () => {
  it("responde 401 sin token", async () => {
    const res = await request(app).post("/products").send(validProduct);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token requerido");
  });

  it("responde 401 con un token inválido", async () => {
    const res = await request(app).post("/products").set("Authorization", "Bearer abc").send(validProduct);
    expect(res.status).toBe(401);
  });

  it("responde 401 con un token vencido", async () => {
    const expired = jwt.sign({ username: "admin" }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app).post("/products").set("Authorization", `Bearer ${expired}`).send(validProduct);
    expect(res.status).toBe(401);
  });

  it("responde 400 con el detalle de cada campo inválido", async () => {
    const res = await request(app).post("/products").set(auth).send({ name: "", price: -5, stock: 1.5 });
    expect(res.status).toBe(400);
    const campos = res.body.errors.map((e) => e.path[0]);
    expect(campos).toEqual(expect.arrayContaining(["name", "price", "stock"]));
  });

  it("crea el producto (201) y publica el evento con el usuario del token", async () => {
    const res = await request(app).post("/products").set(auth).send(validProduct);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(validProduct);
    expect(res.body._id).toBeDefined();
    expect(events.publish).toHaveBeenCalledWith(
      "producto.creado",
      expect.objectContaining({ createdBy: "admin", name: "Teclado" })
    );
  });

  it("crea el producto aunque RabbitMQ falle", async () => {
    events.publish.mockRejectedValue(new Error("sin conexión"));
    const res = await request(app).post("/products").set(auth).send(validProduct);
    expect(res.status).toBe(201);
  });
});

describe("GET /products", () => {
  it("devuelve una lista vacía al inicio y no pide token", async () => {
    const res = await request(app).get("/products");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("lista los productos creados", async () => {
    await request(app).post("/products").set(auth).send(validProduct);
    await request(app).post("/products").set(auth).send({ name: "Mouse", price: 5, stock: 2 });
    const res = await request(app).get("/products");
    expect(res.body.map((p) => p.name)).toEqual(["Teclado", "Mouse"]);
  });
});

describe("GET /products/:id", () => {
  it("devuelve el producto", async () => {
    const created = await request(app).post("/products").set(auth).send(validProduct);
    const res = await request(app).get(`/products/${created.body._id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Teclado");
  });

  it("responde 400 si el id es inválido", async () => {
    const res = await request(app).get("/products/abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ID inválido");
  });

  it("responde 404 si no existe", async () => {
    const res = await request(app).get("/products/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Producto no encontrado");
  });
});

describe("PUT /products/:id", () => {
  it("actualiza el producto", async () => {
    const created = await request(app).post("/products").set(auth).send(validProduct);
    const res = await request(app).put(`/products/${created.body._id}`).set(auth).send({ name: "Teclado mecánico", price: 60, stock: 8 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Teclado mecánico", price: 60, stock: 8 });
  });

  it("responde 400 si el body es inválido", async () => {
    const created = await request(app).post("/products").set(auth).send(validProduct);
    const res = await request(app).put(`/products/${created.body._id}`).set(auth).send({ name: "", price: 1, stock: 1 });
    expect(res.status).toBe(400);
  });

  it("responde 404 si no existe", async () => {
    const res = await request(app).put("/products/999").set(auth).send(validProduct);
    expect(res.status).toBe(404);
  });

  it("responde 401 sin token y no modifica nada", async () => {
    const created = await request(app).post("/products").set(auth).send(validProduct);
    const res = await request(app).put(`/products/${created.body._id}`).send({ name: "Hackeado", price: 1, stock: 1 });
    expect(res.status).toBe(401);
    const get = await request(app).get(`/products/${created.body._id}`);
    expect(get.body.name).toBe("Teclado");
  });
});

describe("DELETE /products/:id", () => {
  it("borra el producto (204) y después ya no existe", async () => {
    const created = await request(app).post("/products").set(auth).send(validProduct);
    const del = await request(app).delete(`/products/${created.body._id}`).set(auth);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/products/${created.body._id}`);
    expect(get.status).toBe(404);
  });

  it("responde 404 si no existe", async () => {
    const res = await request(app).delete("/products/999").set(auth);
    expect(res.status).toBe(404);
  });

  it("responde 401 sin token y el producto sigue existiendo", async () => {
    const created = await request(app).post("/products").set(auth).send(validProduct);
    const res = await request(app).delete(`/products/${created.body._id}`);
    expect(res.status).toBe(401);
    const get = await request(app).get(`/products/${created.body._id}`);
    expect(get.status).toBe(200);
  });
});
