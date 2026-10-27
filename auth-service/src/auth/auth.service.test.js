import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { createAuthService } from "./auth.service.js";
import { InvalidCredentialsError, NotFoundError } from "../shared/errors.js";

// Test unitario: el caso de uso se prueba con un repositorio "mock". No hay base de datos.
describe("auth.service", () => {
  let repository;
  let service;
  let adminHash;

  beforeAll(async () => {
    adminHash = await bcrypt.hash("1234", 4); // costo bajo: solo para que el test sea rápido
  });

  beforeEach(() => {
    repository = {
      findByUsername: vi.fn(),
      create: vi.fn(),
      incrementProductsCreated: vi.fn(),
    };
    service = createAuthService(repository);
  });

  describe("ensureDefaultUser", () => {
    it("crea el usuario admin con la clave cifrada si no existe", async () => {
      repository.findByUsername.mockResolvedValue(null);

      await service.ensureDefaultUser();

      expect(repository.create).toHaveBeenCalledTimes(1);
      const saved = repository.create.mock.calls[0][0];
      expect(saved.username).toBe("admin");
      expect(saved.passwordHash).not.toBe("1234");
      expect(await bcrypt.compare("1234", saved.passwordHash)).toBe(true);
    });

    it("no hace nada si el usuario ya existe", async () => {
      repository.findByUsername.mockResolvedValue({ username: "admin" });
      await service.ensureDefaultUser();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("devuelve un JWT con el usuario si las credenciales son correctas", async () => {
      repository.findByUsername.mockResolvedValue({ username: "admin", passwordHash: adminHash });

      const token = await service.login({ username: "admin", password: "1234" });

      expect(service.verifyToken(token).username).toBe("admin");
    });

    it("lanza InvalidCredentialsError si la clave es incorrecta", async () => {
      repository.findByUsername.mockResolvedValue({ username: "admin", passwordHash: adminHash });
      await expect(service.login({ username: "admin", password: "mal" })).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it("lanza InvalidCredentialsError si el usuario no existe", async () => {
      repository.findByUsername.mockResolvedValue(null);
      await expect(service.login({ username: "nadie", password: "1234" })).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });

  describe("verifyToken", () => {
    it("rechaza un token inválido", () => {
      expect(() => service.verifyToken("abc")).toThrow();
    });
  });

  describe("getProfile", () => {
    it("devuelve el usuario y su contador, sin la clave", async () => {
      repository.findByUsername.mockResolvedValue({ username: "admin", passwordHash: adminHash, productsCreated: 3 });
      expect(await service.getProfile("admin")).toEqual({ username: "admin", productsCreated: 3 });
    });

    it("lanza NotFoundError si el usuario no existe", async () => {
      repository.findByUsername.mockResolvedValue(null);
      await expect(service.getProfile("nadie")).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("registerProductCreated", () => {
    it("suma uno al contador del usuario", async () => {
      await service.registerProductCreated("admin");
      expect(repository.incrementProductsCreated).toHaveBeenCalledWith("admin");
    });

    it("ignora el evento si no trae usuario", async () => {
      await service.registerProductCreated(undefined);
      expect(repository.incrementProductsCreated).not.toHaveBeenCalled();
    });
  });
});
