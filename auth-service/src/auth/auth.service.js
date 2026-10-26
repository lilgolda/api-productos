import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { InvalidCredentialsError, NotFoundError } from "../shared/errors.js";

const DEFAULT_USER = "admin";
const DEFAULT_PASSWORD = "1234";

export function createAuthService(repository) {
  return {
    async ensureDefaultUser() {
      const existing = await repository.findByUsername(DEFAULT_USER);
      if (existing) return;
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await repository.create({ username: DEFAULT_USER, passwordHash });
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
