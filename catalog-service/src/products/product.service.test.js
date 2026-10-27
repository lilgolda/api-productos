import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProductService } from "./product.service.js";
import { NotFoundError } from "../shared/errors.js";

// Test unitario: el caso de uso se prueba con repositorio, eventos y logger "mock".
// No hay base de datos, ni RabbitMQ, ni Express.
describe("product.service", () => {
  let repository;
  let events;
  let logger;
  let service;

  beforeEach(() => {
    repository = {
      isValidId: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    events = { publish: vi.fn().mockResolvedValue(undefined) };
    logger = { error: vi.fn() };
    service = createProductService(repository, events, logger);
  });

  describe("create", () => {
    it("guarda el producto y publica el evento product.created", async () => {
      const data = { name: "Teclado", price: 45.5, stock: 10 };
      repository.create.mockResolvedValue({ _id: "abc123", ...data });

      const product = await service.create(data, "admin");

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(product._id).toBe("abc123");
      expect(events.publish).toHaveBeenCalledWith(
        "product.created",
        expect.objectContaining({ productId: "abc123", name: "Teclado", createdBy: "admin" })
      );
    });

    it("si RabbitMQ falla, el producto igual se crea y el error se registra", async () => {
      const data = { name: "Mouse", price: 5, stock: 2 };
      repository.create.mockResolvedValue({ _id: "m1", ...data });
      const failure = new Error("sin conexión");
      events.publish.mockRejectedValue(failure);

      const product = await service.create(data, "admin");

      expect(product.name).toBe("Mouse");
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: failure, productId: "m1" }),
        "No se pudo publicar product.created"
      );
    });

    it("si guardar en la base falla, no publica ningún evento", async () => {
      repository.create.mockRejectedValue(new Error("base caída"));

      await expect(service.create({ name: "A", price: 1, stock: 1 }, "admin")).rejects.toThrow("base caída");
      expect(events.publish).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("devuelve lo que entrega el repositorio", async () => {
      repository.findAll.mockResolvedValue([{ _id: "1" }, { _id: "2" }]);
      expect(await service.list()).toHaveLength(2);
    });
  });

  describe("getById", () => {
    it("devuelve el producto si existe", async () => {
      repository.findById.mockResolvedValue({ _id: "1", name: "A" });
      expect((await service.getById("1")).name).toBe("A");
    });

    it("lanza NotFoundError si no existe", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getById("999")).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("update", () => {
    it("actualiza y devuelve el producto", async () => {
      repository.update.mockResolvedValue({ _id: "1", name: "B" });
      const product = await service.update("1", { name: "B", price: 2, stock: 3 });
      expect(repository.update).toHaveBeenCalledWith("1", { name: "B", price: 2, stock: 3 });
      expect(product.name).toBe("B");
    });

    it("lanza NotFoundError si no existe", async () => {
      repository.update.mockResolvedValue(null);
      await expect(service.update("999", { name: "X", price: 1, stock: 1 })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("remove", () => {
    it("borra el producto", async () => {
      repository.delete.mockResolvedValue({ _id: "1" });
      await expect(service.remove("1")).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith("1");
    });

    it("lanza NotFoundError si no existe", async () => {
      repository.delete.mockResolvedValue(null);
      await expect(service.remove("999")).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
