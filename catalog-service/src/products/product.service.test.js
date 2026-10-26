import test from "node:test";
import assert from "node:assert/strict";
import { createProductService } from "./product.service.js";
import { NotFoundError } from "../shared/errors.js";

function fakeRepository() {
  const items = new Map();
  let counter = 0;
  return {
    isValidId: (id) => typeof id === "string" && id.length > 0,
    create: async (data) => {
      const product = { _id: String(++counter), ...data };
      items.set(product._id, product);
      return product;
    },
    findAll: async () => [...items.values()],
    findById: async (id) => items.get(id) ?? null,
    update: async (id, data) => {
      if (!items.has(id)) return null;
      const product = { ...items.get(id), ...data };
      items.set(id, product);
      return product;
    },
    delete: async (id) => {
      const product = items.get(id) ?? null;
      items.delete(id);
      return product;
    },
  };
}

function fakeEvents() {
  const published = [];
  return { published, publish: async (key, payload) => published.push({ key, payload }) };
}

test("crea y lista productos", async () => {
  const service = createProductService(fakeRepository(), fakeEvents());
  await service.create({ name: "Teclado", price: 10, stock: 5 }, "admin");
  const products = await service.list();
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "Teclado");
});

test("al crear un producto publica el evento product.created", async () => {
  const events = fakeEvents();
  const service = createProductService(fakeRepository(), events);
  const product = await service.create({ name: "Mouse", price: 5, stock: 2 }, "admin");
  assert.equal(events.published.length, 1);
  assert.equal(events.published[0].key, "product.created");
  assert.equal(events.published[0].payload.createdBy, "admin");
  assert.equal(events.published[0].payload.productId, product._id);
});

test("si RabbitMQ falla, el producto igual se crea", async () => {
  const brokenEvents = { publish: async () => { throw new Error("sin conexión"); } };
  const service = createProductService(fakeRepository(), brokenEvents);
  const originalError = console.error;
  console.error = () => {};
  try {
    const product = await service.create({ name: "A", price: 1, stock: 1 }, "admin");
    assert.equal(product.name, "A");
  } finally {
    console.error = originalError;
  }
});

test("getById lanza NotFoundError si no existe", async () => {
  const service = createProductService(fakeRepository(), fakeEvents());
  await assert.rejects(() => service.getById("999"), NotFoundError);
});

test("update cambia los datos y falla si no existe", async () => {
  const service = createProductService(fakeRepository(), fakeEvents());
  const created = await service.create({ name: "A", price: 1, stock: 1 }, "admin");
  const updated = await service.update(created._id, { name: "B", price: 2, stock: 3 });
  assert.equal(updated.name, "B");
  await assert.rejects(() => service.update("999", { name: "X", price: 1, stock: 1 }), NotFoundError);
});

test("remove borra el producto y falla si no existe", async () => {
  const service = createProductService(fakeRepository(), fakeEvents());
  const created = await service.create({ name: "A", price: 1, stock: 1 }, "admin");
  await service.remove(created._id);
  await assert.rejects(() => service.remove(created._id), NotFoundError);
});
