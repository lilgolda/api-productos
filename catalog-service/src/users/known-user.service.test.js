import { beforeEach, describe, expect, it, vi } from "vitest";
import { createKnownUserService } from "./known-user.service.js";

describe("known-user.service", () => {
  let repository;
  let logger;
  let service;

  beforeEach(() => {
    repository = { save: vi.fn().mockResolvedValue(undefined) };
    logger = { info: vi.fn() };
    service = createKnownUserService(repository, logger);
  });

  it("guarda el usuario con la fecha del evento y avisa en el log", async () => {
    await service.recordUserCreated({ username: "ana", at: "2026-10-27T10:00:00.000Z" });

    expect(repository.save).toHaveBeenCalledWith({
      username: "ana",
      registeredAt: new Date("2026-10-27T10:00:00.000Z"),
    });
    expect(logger.info).toHaveBeenCalledWith({ username: "ana" }, expect.stringContaining("usuario.creado"));
  });

  it("si el evento no trae fecha, usa la actual", async () => {
    await service.recordUserCreated({ username: "ana" });
    expect(repository.save.mock.calls[0][0].registeredAt).toBeInstanceOf(Date);
  });

  it("ignora un evento sin usuario", async () => {
    await service.recordUserCreated({});
    expect(repository.save).not.toHaveBeenCalled();
  });
});
