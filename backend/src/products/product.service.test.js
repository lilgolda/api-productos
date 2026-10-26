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

test("crea y lista productos", async () => {
  const service = createProductService(fakeRepository());
  await service.create({ name: "Teclado", price: 10, stock: 5 });
  const products = await service.list();
  assert.equal(products.length, 1);
  assert.equal(products[0].name, "Teclado");
});

test("getById lanza NotFoundError si no existe", async () => {
  const service = createProductService(fakeRepository());
  await assert.rejects(() => service.getById("999"), NotFoundError);
});

test("update cambia los datos y falla si no existe", async () => {
  const service = createProductService(fakeRepository());
  const created = await service.create({ name: "A", price: 1, stock: 1 });
  const updated = await service.update(created._id, { name: "B", price: 2, stock: 3 });
  assert.equal(updated.name, "B");
  await assert.rejects(() => service.update("999", { name: "X", price: 1, stock: 1 }), NotFoundError);
});

test("remove borra el producto y falla si no existe", async () => {
  const service = createProductService(fakeRepository());
  const created = await service.create({ name: "A", price: 1, stock: 1 });
  await service.remove(created._id);
  await assert.rejects(() => service.remove(created._id), NotFoundError);
});
