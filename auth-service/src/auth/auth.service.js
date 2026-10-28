import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ConflictError, InvalidCredentialsError, NotFoundError } from "../shared/errors.js";

const DEFAULT_USER = "admin";
const DEFAULT_PASSWORD = "1234";

const noEvents = { publish: async () => {} };
const silentLogger = { error() {} };

export function createAuthService(repository, events = noEvents, logger = silentLogger) {
  return {
    async ensureDefaultUser() {
      const existing = await repository.findByUsername(DEFAULT_USER);
      if (existing) return;
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await repository.create({ username: DEFAULT_USER, passwordHash });
    },

    async register({ username, password }) {
      if (await repository.findByUsername(username)) {
        throw new ConflictError("El usuario ya existe");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      try {
        await repository.create({ username, passwordHash });
      } catch (err) {
        if (err.code === 11000) throw new ConflictError("El usuario ya existe");
        throw err;
      }

      try {
        await events.publish("usuario.creado", { username, at: new Date().toISOString() });
      } catch (err) {
        logger.error({ err, username }, "No se pudo publicar usuario.creado");
      }

      return { username };
    },

    async login({ username, password }) {
      const user = await repository.findByUsername(username);
      const valid = user && (await bcrypt.compare(password, user.passwordHash));
      if (!valid) throw new InvalidCredentialsError();
      return jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
    },

    verifyToken: (token) => jwt.verify(token, process.env.JWT_SECRET),

    async getProfile(username) {
      const user = await repository.findByUsername(username);
      if (!user) throw new NotFoundError("Usuario no encontrado");
      return { username: user.username, productsCreated: user.productsCreated };
    },

    async registerProductCreated(username) {
      if (!username) return;
      await repository.incrementProductsCreated(username);
    },
  };
}
