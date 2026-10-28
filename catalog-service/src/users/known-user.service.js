const silentLogger = { info() {} };

export function createKnownUserService(repository, logger = silentLogger) {
  return {
    async recordUserCreated({ username, at }) {
      if (!username) return;
      await repository.save({ username, registeredAt: at ? new Date(at) : new Date() });
      logger.info({ username }, "Usuario nuevo registrado (evento usuario.creado)");
    },
  };
}
